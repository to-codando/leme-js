import { render } from "./lemeJs.factory.js"

export const routerFactory = () => {

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

    const _loadByHash = (hash) => {

        const route = routes.find( route => route.regExpRoute.test(hash))
        const routeParams = _getRouteParams(route)
        const options = { routeParams }

        if(route) {
            render(route.component, routerElement, options)
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