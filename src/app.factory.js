import { html, css } from './tagged.template'
import { uuid } from "./uuid"
import { domFactory } from "./dom.factory"
import { dataBind } from './dataBind'

export const createApp = (selector, mainFactory, router = null) => {

  const hasState = (component) => 
    component.hasOwnProperty("state") && keyHasFunction("on", component.state) 

  const watchState = (component) => {
    if(!hasState(component)) return

    component.state.on((newState) => {
      render(component, newState)
    })
  }

  const getPropsAsObject = (props) => {
    const propsX = {}
    for(let key in props) { 
      propsX[key] = JSON.parse(props[key].replace(/\"/ig, '').replace(/\'/ig, '"'))
    }    
    return propsX
  }

  const toProp = (propName, propValue) => {
    const dataValue = JSON.stringify(propValue).replace(/\"/ig, "'")
    return `data-${propName}="${dataValue}"`
  }  

  const createComponents = (factory, refElements = [], options = {}) => {
    const selector = createSelector(factory.name)

    return refElements.map( (refElement, index ) => {
      const componentElement = createElement(selector)
      const props = getPropsAsObject(refElement.dataset)
      const contextId = uuid(selector)
      const component = factory({ dataBind, props, ...options })

      componentElement.setAttribute('ukey', index || 0)
      component.element = componentElement
      component.refElement = refElement
      component.parentElement = refElement.parentElement
      component.selector = selector
      component.props = props
      component.contextId = contextId    
      component.ukey = index  
      watchState(component)

      return component
    })

  }

  const createSelector = (text) => 
    text.split(/(?=[A-Z])/).join("-").toLowerCase()

  const createElement = (selector) => document.createElement(selector)

  const applyContext = (text, id) => text.replace(/ctx-/gi, id)

  const bindStyles = (component) => {
    const styleExists = document.querySelector(`style#${component.contextId}`)
    if (styleExists) return;

    const styleElement = document.createElement("style")
    styleElement.setAttribute('id', component.contextId)
    
    const styles = component.styles({
      ctx: component.selector, 
      props: component.props,
      css
    })
    
    styleElement.innerHTML = applyContext(styles, component.contextId)
    document.querySelector("head").append(styleElement)
  }

  const keyHasFunction = (key, object) => 
    object.hasOwnProperty(key) && typeof object[key] === "function"

  const executeHook = (hookName, hooks, options) => {
    if (!keyHasFunction(hookName, hooks)) return
    hooks[hookName](options)
  }

  const bindHook = (hookName, component) => {
    if (!keyHasFunction("hooks", component)) return
    const dom = domFactory(component.element)
    const hooks = component.hooks(dom)
    setTimeout(()=> executeHook(hookName, hooks, dom), 10)
  }

  const _getRefs = (containerElement, childrenSelector) => {
    const refElements = containerElement.querySelectorAll(childrenSelector)
    return Array.from(refElements)
  }

  const renderChildren = (parentComponent) => {
    if (!keyHasFunction("children", parentComponent)) return

    const { children } = parentComponent
    const childrenFactories = children()

    for (let key in childrenFactories) {

      const childFactory = childrenFactories[key]
      const selector = createSelector(key)
      const refElements = _getRefs(parentComponent.element, selector)
      const components = createComponents(childFactory, refElements)

      components.forEach( component => {
        bindHook("beforeOnInit", component)
        render(component)
        bindHook("afterOnInit", component)
      })
      
    }
  }

  const bindSingleSlot = (component) => {
    const slotElement = component.element.querySelector('slot')
    if(!slotElement || !slotElement.outerHTML) return
    const childrenElements = component.refElement.innerHTML
    slotElement.outerHTML = childrenElements
  }

  const bindMultipleSlots = (component, inputSlotElements) => {
    inputSlotElements.forEach( inputElement => {
      const outputId = inputElement.getAttribute('slot-id')
      const outputElement = component.element.querySelector(`[slot-id="${outputId}"]`)
      if(!outputElement || !outputElement.outerHTML) return
      outputElement.outerHTML = inputElement.innerHTML
    })
  }

  const bindSlots = (component) => {
    const inputSlotElements  = Array.from(component.refElement.querySelectorAll('[slot-id]'))
    if(inputSlotElements && inputSlotElements.length) 
      return bindMultipleSlots(component, inputSlotElements)
    bindSingleSlot(component)
  }

  const resetReferences = (component) => {
    setTimeout(() => {
      const selector = `${component.selector}[ukey="${component.ukey}"]`
      component.refElement = document.querySelector(selector)
      component.parentElement = component.refElement.parentElement
    }, 1)
  }

  const render = async (component, payload = {}) => {
    // const state = component?.state?.get() || {}
    const state = {...component?.state?.get(), ...payload }
    const { template, contextId, props } = component

    bindHook("beforeOnRender", component)

    component.element.innerHTML = applyContext(
      template({ state, props, toProp, html, css }), 
      contextId
    )

    bindSlots(component)
    component.refElement.replaceWith(component.element)
    resetReferences(component)

    bindStyles(component)
    bindHook("afterOnRender", component)
    renderChildren(component)
  }

  const init = async () => {
    const payload = {}
    const componentSelector = createSelector(mainFactory.name)
    const appElement = document.querySelector(selector)
    const refElements = _getRefs(appElement, componentSelector)
    const components = createComponents(mainFactory, refElements, payload)

    await render(components[0], payload)

    if(!router) return

    router.setRender(render)
    router.setElement(appElement)
    router.setComponentCreator(createComponents)
    router.setHooksDispatcher(bindHook)
    router.setQueryRefs(_getRefs)
    router.init()

  }

  return { init }
}
