export const domFactory = (context) => {
    
    const on = (eventName, target, handler) => {

        const elements = Array.isArray(target) ? target : [target]

        elements.forEach( element => {
            element[`on${eventName}`] = handler 
        })
    }

    const queryOnce = (selector) => {
        return context.querySelector(selector)
    }

    const queryAll = (selector) => {
        return Array.from(context.querySelectorAll(selector))
    }

    return {
        on,
        queryOnce,
        queryAll,
        appElement: context
    }

}

