export const observableFactory = (value) => {

    let _handlers = []
    let _value = value
  
    const on = (handler) => {
  
      if((typeof handler) === 'function')  {
        _handlers = [..._handlers, handler];
        return handler
      }
  
      throw new Error('Handler is not a function and must be.')
  
    }
  
    const off = (targetHandler) => {
      _handlers = _handlers.filter( handler => {
        if(handler !== targetHandler) return handler
      })
    }
  
    const set = (payload) => {
        _value = Object.assign({}, _value, payload)
      _handlers.forEach( handler => handler(_value))
    }
  
    const get = () => _value
  
    return { on, off, set, get }
  
  }