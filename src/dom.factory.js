const domFactory = (targetElement) => {

    const _element = targetElement

    const queryOnce = (selector, element = _element) => {
        return element.querySelector(selector);
    };

    const queryAll = (selector, element = _element) => {
        return Array.from(element.querySelectorAll(selector));
    };

    const _debounce = (handler, delay, focusEnd) => {
        let debounceTimer

        return (e) => {
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => {
                if (focusEnd && typeof focusEnd === 'function') autoFocus(focusEnd)
                return handler(e)
            }, delay)
        }
    }

    const autoFocus = (focusEnd) => {
        const increaseTime = 10
        setTimeout(() => {
            const [selector, targetElement] = focusEnd()
            const inputElement = queryOnce(selector, targetElement)
            const inputType = inputElement.type
            inputElement.type = 'text'
            inputElement.focus()


            if (typeof inputElement.selectionStart == "number") {
                inputElement.selectionStart = inputElement.selectionEnd = inputElement.value.length;
            } else if (typeof inputElement.createTextRange != "undefined") {
                const range = inputElement.createTextRange();
                range.collapse(false);
                range.select();
            }

            inputElement.type = inputType
        }, increaseTime)
    }

    const on = (eventName, eventTarget, handler, options) => {

        const useDebounce = options ? options.useDebounce : false
        const debounceTime = options ? options.debounceTime : 0
        const focusEnd = options ? options.focusEnd : () => []

        if (!Array.isArray(eventTarget)) {

            if (useDebounce) {
                eventTarget[`on${eventName}`] = _debounce(handler, debounceTime, focusEnd)
                return
            }

            eventTarget[`on${eventName}`] = handler
            return
        }

        eventTarget.forEach(element => {
            if (useDebounce) {
                element[`on${eventName}`] = _debounce(handler, debounceTime, focusEnd)
                return
            }

            element[`on${eventName}`] = handler
        })
    }

    return {
        autoFocus,
        queryOnce,
        queryAll,
        on,
    };
};

export { domFactory };