import { uuid } from "./uuid"
import { domFactory } from "./dom.factory"

export const createApp = (selector, factories, router = null) => {
  const appElement = document.querySelector(selector)

  const hasState = (component) => 
    component.hasOwnProperty("state") && keyHasFunction("on", component.state) 

  const watchState = (component) => {
    if(!hasState(component)) return

    component.state.on((payload) => {
      const parentElement = component.element.parentElement
      render(component, parentElement, payload)
    })
  }

  const createComponent = (factory, element = null, parentElement, options = {}) => {
    const selector = createSelector(factory.name)
    const componentElement = element ? element : createElement(selector)
    const props = componentElement.dataset
    const contextId = uuid(selector)
    const component = factory({ props, ...options })
    
    component.element = componentElement
    component.parentElement = parentElement
    component.selector = selector
    component.props = props
    component.contextId = contextId
    watchState(component)

    return component
  }

  const createSelector = (text) => 
    text.split(/(?=[A-Z])/).join("-").toLowerCase()

  const createElement = (selector) => document.createElement(selector)

  const applyContext = (text, id) => text.replace(/ctx-/gi, id)

  const bindStyles = (component) => {
    const styleElement = document.createElement("style")
    const styles = component.styles(component.selector, component.props)
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
    executeHook(hookName, hooks, dom)
  }

  const _getRefs = (parentComponent, childrenSelector) => {
    const refElements = parentComponent.element.querySelectorAll(childrenSelector)
    return Array.from(refElements)
  }

  const renderChildren = (parentComponent) => {
    if (!keyHasFunction("children", parentComponent)) return

    const { children } = parentComponent
    const childrenFactories = children()

    for (let key in childrenFactories) {

      const selector = createSelector(key)
      const refElements = _getRefs(parentComponent, selector)
      const components = refElements.map( refElement => {
        return createComponent(childrenFactories[key], refElement, refElement.parentElement)
      })

      components.forEach( component => {
        const state = component?.state?.get() || {}
        bindHook("beforeOnInit", component)
        render(component, component.parentElement, state)
        bindHook("afterOnInit", component)
      })
      
    }
  }

  const render = (component, parentElement = null, payload = {}) => {
    const { template, contextId, props } = component
    bindHook("beforeOnRender", component)
    component.element.innerHTML = applyContext(template({ ...payload, props }), contextId)

    parentElement 
    ? parentElement.append(component.element)
    : appElement.append(component.element)
    
    bindStyles(component)
    bindHook("afterOnRender", component)
    renderChildren(component)
  }

  const init = () => {
    for (let key in factories) {
      const component = createComponent(factories[key], null, appElement)
      const state = component?.state?.get() || {}
      bindHook("beforeOnInit", component)
      render(component, null, {state})
      bindHook("afterOnInit", component)
    }
    if(router) {
      router.setRender(render)
      router.setElement(appElement)
      router.setComponentCreator(createComponent)
      router.setHooksDispatcher(bindHook)
      router.init()
    }
  }

  return { init }
}
