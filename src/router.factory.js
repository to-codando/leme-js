import { observableFactory } from "./observable.factory.js";
import { render } from "./lemeJs.factory.js"

const routerObservable = observableFactory({})

const _createSelector = (text) => {
    return text
        .split(/(?=[A-Z])/)
        .join("-")
        .toLowerCase();
};

const _createComponentElement = (selector) => { 
    const regexSelector = /^([a-z]+-)+([a-z]+)$/
    if(!selector || typeof selector !== 'string') throw new Error('component selector is not a string and must be.')
    if(!regexSelector.test(selector)) throw new Error('component selector has invalid format.')
    const element = document.createElement(selector)
    return element
}  

const routerFactory = () => {

    let routerElement = null
    let routes = []
    const hashConfig = {initial:'', default:''}

    const _redirectTo = (hash) => {
        window.location.hash = hash
    }

    const _getHash = () => window.location.hash

    const _getRouteParams = (route) => {
        
        const hash = _getHash()
        const hashParts = hash.replace('#/', '').split('/')
        const params = {routeName: hashParts.shift()}

        if(!hashParts || !hashParts.length) return {}

        route.paramNames.forEach( (param, index)=> {
            const paramKey = {[param]: hashParts[index]}
            Object.assign(params, paramKey)
        })

        return params
    }

    const _showException = (title, message) => {
        console.group(title)
            console.error(message)
        console.groupEnd();         
    }

    const _getRouteByHash = (hash) =>  routes.find( route => route.regExpRoute.test(hash))

    const _loadByHash = (hash) => {

        const route = routes.find( route => route.regExpRoute.test(hash))
        
        if(route) {
            const routeParams = _getRouteParams(route)
            const selector = _createSelector(route.component.name)
            const element = _createComponentElement(selector)
            const options = { routeParams, parentElement: routerElement, element, isRouted: true }
            routerObservable.set({ routeParams })
            render(route.component, element, routerElement, options)
            return
        } 

        _redirectTo(hashConfig.default)
        _showException('Route Error: ', `An attempt to access route ${hash} failed because the route is not declared and must be.`)
    }

    const _onHashChange = () => {
        window.onhashchange = () => {
            const hash = _getHash()
            _loadByHash(hash)
        }
    }

    const _onDomLoaded = () => {
        window.addEventListener('DOMContentLoaded', () => {
            const hash = _getHash()
            if(hash) return _loadByHash(hash)
            _redirectTo(hashConfig.initial)
        })
    }

    const init = () => {
        routerElement = document.querySelector('router-view')
        _onDomLoaded()
        _onHashChange()
    }

    const load = (hash) => {
        _redirectTo(hash)
    }

    const add = (regExpRoute, component, paramNames) => {
        routes = [...routes, { regExpRoute, component, paramNames}]
    }    

    const set = (route) => {
        Object.assign(hashConfig, route)
    }

    return {
        add,
        load,
        init,
        set
    }
}

export { routerObservable, routerFactory }