export const pubsubFactory = () => {

    const listeners = {}

    const on = (eventName, handler) => {
        if(!eventName) throw new Error('EventName is not defined and must be.')
        if(!handler || typeof handler !== 'function') throw new Error('Handler is not a function and must be.')

        if(!listeners.hasOwnProperty(eventName)) {
            listeners[eventName] = [ handler ]
            return { eventName, handler }
        }

        listeners[eventName].push(handler)
        return { eventName, handler }
    }

    const off = ({eventName, handler}) => {
        const eventListeners = listeners.filter( listener => {
            if(listener !== handler) return listener
        })

        listeners[eventName] = eventListeners
    }

    const emit = (eventName, payload) => {
        if(!eventName) throw new Error('EventName is not defined and must be.')
        listeners[eventName].forEach( handler => {
            handler(payload)
        })
    }

    return {
        on,
        off,
        emit
    }
}