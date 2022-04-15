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
    let _createComponents = () => {}
    let _bindHook = () => {}
    let _queryRefs = () => {}
    let _routerElement = null

    const _getInitialRoute = () => {
        return _routes.find( route => route.isInitial)
    }
    const _getRouteByHash = () => {
        const hash = window.location.hash
        const route = _routes.find( route => route.validator.test(hash))
        return route ? route : _routes.find( route => route.isDefault) 
    }

    const _getRef = (factory) => {
        const selector = _createSelector(factory.name)
        const tagHTML = `<${selector}> </${selector}>`
        _routerElement.innerHTML = tagHTML
        return _routerElement.firstChild
    }

    const _createSelector = (text) => 
        text.split(/(?=[A-Z])/).join("-").toLowerCase()

    const _create = (factory) => {
        const refElements = [_getRef(factory)]
        const component = _createComponents(factory, refElements, {}).pop()
    
        _bindHook("beforeOnInit", component)
        _render(component, refElements, {})
        _bindHook("afterOnInit", component)
    }

    const _redirectTo = (hash) => {
        window.location.hash = hash
    }

    const _clearRouterElement = () => 
        _routerElement.innerHTML = ''

    const _onDomLoaded = () => {
        

        window.addEventListener('DOMContentLoaded', () => {
            const hash = window.location.hash

            if(hash) {
                const route = _getRouteByHash(hash)
                return _create(route.component)
            }

            const route = _getInitialRoute()
            _redirectTo(route.hash)
            _create(route.component)
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

    const setComponentCreator = (creator) => _createComponents = creator

    const setQueryRefs = (query) => _queryRefs = query

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
        setQueryRefs,
        add
    }

}