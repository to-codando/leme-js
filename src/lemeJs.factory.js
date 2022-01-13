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
    const props = component.props ? component.props : {}
    if(!component.methods) return {}
	const methods = component.methods({ props })
	const publicMethods = { ...methods }
    return component.methods({props, publicMethods })
}

const _getChildren = (component) => {
    return component.children ? component.children() : []
}

const _bindDomEvents = (component = {}, props = {}) => {
    const dom = domFactory(component.element)
    const methods = _getMethods(component)
    const events = component.events ? component.events({...dom, methods, props }) : {}
    Object.keys(events).forEach( eventName => events[eventName]())
}

const _execHook = (component, hookName, stateWatcher = null) => {
    const methods = _getMethods(component)
    const props = _getPropsFrom(component)
    const hooks = component.hooks ? component.hooks({methods, props }) : {}
	const offStateChanges = () => { 
		component.state.off(stateWatcher[component.selector])
	}
    if(hooks.hasOwnProperty(hookName)) hooks[hookName](offStateChanges)
}

const _renderChildren = (component,  options ) => { 
    const children = _getChildren(component)

    children.forEach( child => {

        const selector = _createSelector(child.name)
        const elements = Array.from(component.element.querySelectorAll(selector))

        elements.forEach( element => {
            const componentOptions = { ...options, parentElement: component.element, element, isRouted: false }
            render(child, element, component.element, componentOptions)
        })
    })

}


const _injectTemplate = (component, element, options =  {}) => {
	
    const { state, template } = component
    const props = _getPropsFrom(component)

    const resources = { 
        state: state.get(), 
        props,
        methods: _getMethods(component),
        html
    }

    _execHook(component, 'beforeOnRender')
    _bindStyles(component)

    if(options && options.isRouted) {
        component.element = options.element
        component.element.innerHTML =  template(resources)
        options.parentElement.innerHTML = ''
        options.parentElement.insertAdjacentElement('beforeend', component.element)
        _execHook(component, 'afterOnRender')
        _bindDomEvents(component, props)
        return
    }

    element.innerHTML = template(resources)
    _execHook(component, 'afterOnRender')
    _bindDomEvents(component, props)
}

const _observeState = (component, options) => {   
	const { selector } = component
	const stateWatcher = {
		[selector]: () => { 
			const componentOptions = {routeParams:() => options.routeParams, element: component.element, isRouted: false, parentElement: component.element.parentElement}
			const props =  _getPropsFrom(component)
			
			_injectTemplate(component, component.element,  component.parentElement, { props})
			_bindDomEvents(component, props)
			_renderChildren(component, {...componentOptions })
			_execHook(component, 'onDestroy', stateWatcher)
		}
	}
	
	component.stateWatcher =  component.state.on(stateWatcher[selector])  
}

const _createComponentElement = (selector) => { 
    const regexSelector = /^([a-z]+-)+([a-z]+)$/
    if(!selector || typeof selector !== 'string') throw new Error('component selector is not a string and must be.')
    if(!regexSelector.test(selector)) throw new Error('component selector has invalid format.')
    const element = document.createElement(selector)
    return element
}

export const _getPropsFrom = (component) => {
    if(!component || !component.element) return {}
    if(!component.element.dataset) return {}
    
    const jsonDataset = JSON.stringify(component.element.dataset)
    return JSON.parse(jsonDataset)
}

export const render = (factory, element, parentElement, options =  {}) => {
    
    const selector =  _createSelector(factory.name)
    const component = factory(options)  
    
    component.selector = selector
    component.element = element

    _observeState(component, options)
    _execHook(component, 'onDestroy', component.stateWatcher)
    _execHook(component, 'beforeOnInit')
    _injectTemplate(component, element, options)
    _execHook(component, 'afterOnInit')
    _renderChildren(component, options)
    _execHook(component, 'afterOnChildrenInit')
}

export const lemeJs = (config) => {

    const appMain = config.appMain || null
    const  router = config.router || null

    const init = () => {
        if(!appMain || typeof appMain !== 'function') throw new Error('The appMain not is an function and must be.')
        const element = document.querySelector('app-main')
        const options = { isRouted: false, element, parentElement: element.parentElement, routeParams: {}}
        render(appMain, element, element.parentElement, options)
        if(router) router.init()
    }

    return {
        init
    }
}