import { observerFactory } from 'lemejs'

const message = 'the element parameter must be an html element and props must be an object containing the properties of the html element'

export const dataBind = (element, props) => {
  const isInvlid = (!element || !props || !Object.keys(props).length)
  if (isInvlid) throw new Error(message)
  const state = observerFactory({ ...props })

  state.on((data) => {
    setAttributes(element, data)
  })

  const setValue = (value) => {
    state.set({
      ...state.get(),
      ...value
    })
  }

  const setAttributes = (element, attrs) => {
    for (const key in attrs) {
      element.setAttribute(key, attrs[key])
    }
  }

  return [setValue, state.on]
}
