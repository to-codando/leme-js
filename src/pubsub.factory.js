export const pubsubFactory = () => {

    const listeners = {}

	const _handlerExists = (eventName, handler) => {
		if(!listeners.hasOwnProperty(eventName)) return false

		return listeners[eventName].some( subscribedHandler => {
			return subscribedHandler.toString() === handler.toString()
		})
	}	

    const on = (eventName, handler) => {
        if(!eventName) throw new Error('EventName is not defined and must be.')
        if(!handler || typeof handler !== 'function') throw new Error('Handler is not a function and must be.')

        
		if(!listeners.hasOwnProperty(eventName)) {
            listeners[eventName] = [ handler ]
            return { eventName, handler }
        }
		
		if(_handlerExists(eventName, handler)) return
        listeners[eventName].push(handler)
        return { eventName, handler }
    }

    const off = ({eventName, handler}) => {

		if(!listeners.hasOwnProperty(eventName)) return 

        const eventListeners = listeners[eventName].filter( listener => {
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