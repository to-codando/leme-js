import { pubsubFactory } from './pubsub.factory.js';

const storeFactory = ({ state, mutations }) => {

	const _eventEmitter = pubsubFactory()

	let _stateHistory = [JSON.parse(JSON.stringify(state))]
	let _activeHistoryStateIndex = 0;
	const _state = JSON.parse(JSON.stringify(state))
	const _mutations = mutations

	const _getLastIndexHistoryState = () => {
		return _stateHistory.length - 1
	}

	const _getActiveState = (index) => _stateHistory[index]

	const _setActiveHistoryIndex = (index) => {
		if (!index) {
			_activeHistoryStateIndex = _stateHistory.length
			return
		}

		_activeHistoryStateIndex = index
	}

	const _setStateHistory = (newState) => {
		_stateHistory = [..._stateHistory, newState]
	}

	const _setState = (eventName, payload) => {
		const newState = JSON.parse(JSON.stringify(_mutations[eventName](_state, payload)))
		Object.assign(_state, newState)
		_setActiveHistoryIndex()
		_setStateHistory(newState)
		return newState
	}

	const _setActiveState = (newActiveState) => {
		const deepState = JSON.parse(JSON.stringify(newActiveState))
		Object.assign(_state, deepState)
	}

	const _logState = () => {
		console.group()
		console.log('..................STORE.........................')
		console.log(` History index: ${_activeHistoryStateIndex}`)
		console.log(` Current State: ${JSON.stringify(_state)}`)
		console.log('................................................')
		console.groupEnd()
	}

	const off = (handler) => {
		const event = {
			eventName: 'on:updated:store',
			handler
		}
		_eventEmitter.off(event)
	}

	const on = (eventName, callback) => {
		const result = _eventEmitter.on(eventName, callback)
		_eventEmitter.on('on:updated:store', callback)
		return result
	}

	const onUpdated = (callback) => {
		_eventEmitter.on('on:updated:store', (data) => {
			callback(data)
		})
	}

	const emit = (eventName, payload) => {
		const newState = _setState(eventName, payload)
		_eventEmitter.emit('on:updated:store', newState)
		// _eventEmitter.emit(eventName, newState)
	}

	const prev = () => {
		if (_activeHistoryStateIndex > 0) {
			_activeHistoryStateIndex = _activeHistoryStateIndex - 1
			const newActiveState = _getActiveState(_activeHistoryStateIndex)
			_setActiveState(newActiveState)
			_eventEmitter.emit('on:updated:store', newActiveState)
		}

	}

	const next = () => {
		if (_activeHistoryStateIndex < _getLastIndexHistoryState()) {
			_activeHistoryStateIndex = _activeHistoryStateIndex + 1
			const newActiveState = _getActiveState(_activeHistoryStateIndex)
			_setActiveState(newActiveState)
			_eventEmitter.emit('on:updated:store', newActiveState)
		}
	}


	const getState = (index = 0) => {
		if (index >= 1) return _stateHistory[index]
		return _stateHistory[_activeHistoryStateIndex]
	}

	const startNavigator = () => {

		const template = `
      <store-navigator>
        <div id="controllers">
          <button id="prev">prev</button>
          <button id="next">next</button>
        </div>

        <style>
          store-navigator {
            box-sizing:border-box;  
            display:block;
            float:left;
            width:100%;
              background:#000;
            position:fixed;
            bottom:0;
            left:0;
          }

          store-navigator #controllers {
            display:block;
            margin:0 auto;
            padding:15px;
            background:#000;
            text-align:center;
          }

          store-navigator button {
            display:inline-block;
            padding:7.5px 15px;
            background:#333;
            color:#ebebeb;
          }
        </style>
      </store-navigator>
    `
		const storeNavigator = document.querySelector('store-navigator')
		document.body.insertAdjacentHTML('beforeend', template)

		const prevButton = document.querySelector('#prev')
		const nextButton = document.querySelector('#next')

		prevButton.onclick = () => {
			prev()
			_logState()
		}
		nextButton.onclick = () => {
			next()
			_logState()
		}
	}


	return { on, off, emit, onUpdated, prev, next, getState, startNavigator }
}

export { storeFactory }
