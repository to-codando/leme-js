import { observerFactory } from "./observer.factory"

export const routerParamsFactory = () => {
    const hash = window.location.hash.replace('#/', '')
    const params = hash.split('/')

    const getFirst = () => {
        const firstPosition = 0
        return params[firstPosition] || null
    }

    const getLast = () => {
        const lastPosition = params.length - 1
        return params[lastPosition]
    }

    const getPosition = (positonNumber = 1) => {

        return positonNumber >= 1
            ? params[positonNumber - 1]
            : params[positonNumber]
    }

    const getAll = () => [ ...params ]

    return {
        getAll,
        getFirst,
        getLast,
        getPosition
    }
}

export const routerFactory = () => {

    let _routes = []
    let _render = () => {}
    let _createComponent = () => {}
    let _bindHook = () => {}
    let _routerElement = null

    const _getInitialRoute = () => {
        return _routes.find( route => route.isInitial)
    }
    const _getRouteByHash = () => {
        const hash = window.location.hash
        const route = _routes.find( route => route.validator.test(hash))
        return route ? route : _routes.find( route => route.isDefault) 
    }

    const _create = (factory) => {
        _clearRouterElement()
        const component = _createComponent  (factory, null, _routerElement)
        const state = component?.state?.get() || {}
        _bindHook("beforeOnInit", component)
        _render(component, _routerElement, {state})
        _bindHook("afterOnInit", component)
    }

    const _redirectTo = (hash) => {
        window.location.hash = hash
    }

    const _clearRouterElement = () => 
        _routerElement.innerHTML = ''

    const _onDomLoaded = () => {
        const route = _getInitialRoute()
        window.addEventListener('DOMContentLoaded', () => {
            if(window.location.hash) return _create(route.component)
            _redirectTo(route.hash)
        })
    }    

    const _onHashChange = () => {
        window.addEventListener('hashchange', () => {
            const route = _getRouteByHash()
            _create(route.component)
        })        
    }    

    const add = (route) => {
        _routes = [..._routes, route]
    }

    const setRender = (render) => _render = render

    const setElement = (appElement) => {
        _routerElement = appElement.querySelector('router-view')
    }

    const setHooksDispatcher = (dispatcher) => _bindHook = dispatcher

    const setComponentCreator = (creator) => _createComponent    = creator

    const init = () => {
        _onHashChange()
        _onDomLoaded()
    }

    return {
        init,
        setRender,
        setElement,
        setComponentCreator,
        setHooksDispatcher,
        add
    }

}