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
      builder.children.push({type: "text", text: emitted.value})
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

Parser.init().then(async () => {
  const parser = new Parser;
  const HTML = await Parser.Language.load('tree-sitter-html.wasm');
  parser.setLanguage(HTML);
  const sourceCode = '<div id="my_id" class="flex flex-row">a link to <a href="google.com">text content</a> balls </div>'
  // const sourceCode = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 14l9-5-9-5-9 5 9 5z"></path><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>'
 const tree = parser.parse(sourceCode);
  console.log(reduce(tree.rootNode, {name: "__root__", children: []}))
 console.log(tree.rootNode.toString());
// const callExpression = tree.rootNode.child(0).firstChild;
// console.log(callExpression);
})


document.querySelector('#app').innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`
