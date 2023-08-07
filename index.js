const root = document.getElementById("root");

/** @jsx createElement */
const element = (
  <div style="background: salmon">
    <h1>Hello World1</h1>
    <h2 style="text-align:right">from Flash</h2>
  </div>
);

// returm text object
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// return object
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  // assign props to attributes

  const isPorperty = (child) => child !== "children";

  Object.keys(fiber.props)
    .filter(isPorperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

// render function
let nextUnitOfWork = null;
let wip = null;

function render(element, container) {
  wip = {
    dom: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = wip;
}

function commitRoot() {
  commitWork(wip.child);
  wip = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domRoot = fiber.parent.dom;
  domRoot.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork); // if time available create next unit of work
    shouldYield = deadline.timeRemaining() < 1; // checking time remianing from browser 
  }
  if (!nextUnitOfWork && wip) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop); // browser callback will run callback when there is time available after frame per second


// return next unit of work
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;
  while (index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

render(element, root);
