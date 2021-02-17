import Parser from 'web-tree-sitter'
import './style.css'

const render = (node) => {
  if(node.type == "id") {
    return 'id="' + node.text + '"'
  }
  else {
    return 'unknown="' + node.type + '"'
  }
}

const emitters = {
  // tag_name: (node) => ({type: "tag", value: node.text}),
  // attribute: (node) => ({type: "attribute"}),
  // attribute_name: (node) => ({type: "name", value: node.text}),
  // attribute_value: (node) => ({type: "value", value: node.text}),
  __unknown: (node) => {
    return {type: node.type, value: node.text}
  },
}

const emitterFor = ((emitters) => {
  return (type) => {
    if (emitters[type]) {
      return emitters[type]
    }
    else {
      return emitters.__unknown
    }
  }
})(emitters)

const reduce = (node, builder) => {
  // leaf, should be a collection of attributes
  const emitted = emitterFor(node.type)(node)
  switch (emitted.type) {
    case "element":
      // Tree
      // "open" a new tag
      const tag = {
        type: "tag",
        name: "", // filled by tag_name
        attributes: [],
        children: [],
      }
      // tag name, attributes and children tags are subnodes of
      // this node, so pass new tag in as builder
      node.children.map((child) => reduce(child, tag))
      return builder.children.push(tag)
    case "end_tag":
      // temp hack, end_tag contains a tag_name so we clobber some values
      return
    case "tag_name":
      // Leaf
      builder.name = emitted.value
      return
    case "text":
      builder.children.push({type: "text", attributes: [], children: [],  value: emitted.value})
      return
    case "attribute":
      // Tree, contains a name and value
      const attribute = {name: "", value: ""}
      node.children.map((child) => reduce(child, attribute))
      builder.attributes.push(attribute)
      return builder
    case "attribute_name":
      // Leaf
      builder.name = emitted.value
      return
    case "attribute_value":
      // Leaf
      builder.value = emitted.value
      return
    default:
      node.children.map((child) => reduce(child, builder))
      return builder
  }
}

const attributesToTemple = (attributes) => {
  return attributes.map((attribute) => {
    // - to _
    // TODO: wrap in quotes if req
    return [
     attribute.name.replaceAll("-", "_"),
     ": ",
     '"',
      attribute.value,
     '"',
    ].join("")
  })
}

const toTemple = (tree) => {
  if (tree.type == "text") {
    if (tree.value.match(/^\s*$/)) {
      return null
    }
    return ["\"" + tree.value + "\"", "", []]
  }
  const attributes = attributesToTemple(tree.attributes)
  const openWith = tree.name
  let doBlock = () => "unset"
  if (tree.children.length == 0) {
    doBlock = () => []
  }
  else {
    doBlock = () => {
      return ["do", tree.children.map(toTemple), "end"]
    }
  }
  return [tree.name, attributes.join(", "), doBlock()]
}

const templeToString = (tree, indent = "", lines = []) => {
  // hack for all white space text objects
  if (tree == null) { return lines }
  const tag = [tree[0], tree[1]]
  if (indent != "") {
    // "" joined with " " will muck up first indent level indentation
    tag.reverse().push(indent)
    tag.reverse()
  }
  let block = ""
  if (tree[2].length > 0) { 
    tag.push([indent, tree[2][0]].join("")) // do
    lines.push(tag.join(" "))
    tree[2][1].map((inner) => {
      const inner_lines = templeToString(inner, indent + "  ")
      inner_lines.map((l) => lines.push(l))
    })
    lines.push([indent, tree[2][2]].join("")) // end
  }
  else {
    lines.push(tag.join(" "))
  }
  return lines
}

window.translate = function (input_el, output_el) {
Parser.init().then(async () => {
  // get input code
  const input = input_el.value
  console.log("input: ", input)

  // attempt to translate
  const parser = new Parser;
  const HTML = await Parser.Language.load('tree-sitter-html.wasm');
  parser.setLanguage(HTML);
  const sourceCode = input

  const tree = parser.parse(sourceCode);
  console.log("tr-parse: ", tree.rootNode.toString());

  const reduced = reduce(tree.rootNode, {name: "__root__", children: []})
  console.log("reduce: ", reduced.children)

  const temple = reduced.children.map(toTemple)
  console.log("toTemple: ", temple)

  // assume only one root node TODO 
  const lines = temple.flatMap((line) => templeToString(line, ""))
  console.log("lines: ", lines)

  console.log(lines.join("\n"))

// const callExpression = tree.rootNode.child(0).firstChild;
// console.log(callExpression);
  // output
  output_el.value = lines.join("\n")
})
}
