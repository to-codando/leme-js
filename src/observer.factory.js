export const observerFactory = (value) => {

	let _handlers = []
	let _value = value

	const _handlerExists = (handler) => {
		return _handlers.some(subscribedHandler => {
			return subscribedHandler.toString() === handler.toString() &&
				subscribedHandler.name === handler.name &&
				subscribedHandler === handler
		})
	}

	const on = (handler) => {

		if ((typeof handler) !== "function") {
			throw new Error("Handler is not a function and must be.")
		}

		if(_handlerExists(handler)) return handler


		_handlers = [..._handlers, handler];
		return handler


	}

	const off = (targetHandler) => {
		_handlers = _handlers.filter(handler => {
			if (handler !== targetHandler) return handler
		})
	}

	const set = (payload) => {
		_value = Object.assign({}, _value, payload)
		_handlers.forEach(handler => handler(_value))
	}

	const get = () => _value

	const view = () => {
		console.log(_handlers)
	}

	return { on, off, set, get, view }

}