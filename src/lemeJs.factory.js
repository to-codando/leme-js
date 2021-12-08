import { domFactory } from "./dom.factory.js";
import { html, css } from './tagged.template.js'

const _getStyles = (component) => {
    if(!component || !component.hasOwnProperty('styles')) return ''
    if(typeof component.styles !== 'function') throw new Error('The component style controller is not a function and must be.')
    return component.styles({ ctx: component.selector, css })
}

const _bindStyles = (component) => {
    const selector = _createSelector(component.selector);
    const styles = _getStyles(component);
    const styleExists = document.querySelector(`style#${selector}`)

      ? true
      : false;
    if (styleExists) return;

    if(!styles) return ''

    const styleElement = document.createElement("style");
    styleElement.setAttribute("id", selector);
    styleElement.textContent = styles
    document.head.append(styleElement);
  };

const _createSelector = (text) => {
    return text
      .split(/(?=[A-Z])/)
      .join("-")
      .toLowerCase();
  };

const _getMethods = (component) => {
    return component.methods ? component.methods() : {}
}

const _getChildren = (component) => {
    return component.children ? component.children() : []
}

const _bindDomEvents = (component, dom) => {
    const methods = _getMethods(component)
    const events = component.events ? component.events({...dom, methods}) : {}
    Object.keys(events).forEach( eventName => events[eventName]())
}

const _execHook = (component, hookName) => {
    const methods = _getMethods(component)
    const hooks = component.hooks ? component.hooks({methods}) : {}
    if(hooks.hasOwnProperty(hookName)) hooks[hookName]()
}

const _renderChildren = (component, parentElement, options = {}) => {
    const children = _getChildren(component)
    children.forEach( child => {
        const selector = _createSelector(child.name)
        const elements = Array.from(parentElement.querySelectorAll(selector))
        elements.forEach( element => {
            render(child, element, options)
        })
    })

}

const _injectTemplate = (component, element, parentElement, options) => {
    const { state, template } = component
    component.element = element || _createComponentElement(component.selector)

    const resources = { 
        state: state.get(), 
        methods: _getMethods(component),
        html
    }
    

    _execHook(component, 'beforeOnRender')
    _bindStyles(component)

    if(!element) { 
        component.element.innerHTML = template(resources)
        parentElement.innerHTML = ''
        parentElement.insertAdjacentElement('beforeend', component.element)
        _execHook(component, 'afterOnRender')
        return
    }

    element.innerHTML = template(resources)
    _execHook(component, 'afterOnRender')
}

const _observeState = (componentSources) => {
    const [ component, element, dom ] = componentSources()
    component.state.on(() => {
        _injectTemplate(component, element)
        _bindDomEvents(component, dom)
        _renderChildren(component, element, {})
    })    
}


const _createComponentElement = (selector) => { 
    const regexSelector = /^([a-z]+-)+([a-z]+)$/
    if(!selector || typeof selector !== 'string') throw new Error('component selector is not a string and must be.')
    if(!regexSelector.test(selector)) throw new Error('component selector has invalid format.')
    const element = document.createElement(selector)
    return element
}

export const render = (factory, element, parentElement, options =  {}) => {
    const component = factory(options)  
    const children = _getChildren(component)
    const dom = domFactory(element)

    component.selector = _createSelector(factory.name)

    _execHook(component, 'beforeOnInit')
    _injectTemplate(component, element, parentElement, options)
    _execHook(component, 'afterOnInit')
    _bindDomEvents(component, dom)
    _observeState(() => [component, children, element, dom])
    _renderChildren(component, element, {})
    _execHook(component, 'afterOnChildrenInit')
}

export const lemeJs = (config) => {

    const appMain = config.appMain || null
    const  router = config.router || null

    const init = () => {
        if(!appMain || typeof appMain !== 'function') throw new Error('The appMain not is an function and must be.')
        render(appMain, document.querySelector('app-main'))
        if(router) router.init()
    }

    return {
        init
    }
}