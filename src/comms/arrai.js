import { createAction, createReducer } from 'redux-act'
import ArraiClient from 'arr.ai'

// Incoming actions
export const connect = createAction('connect')
export const close = createAction('close')
export const update = createAction('send')
export const observe = createAction('send')

// Outgoing actions
export const onopen = createAction('onopen')
export const onclose = createAction('onclose')
export const onupdate = createAction('onupdate')
export const onerror = createAction('onerror')

let client

const closeClient = () => {
  if (client) client.close()
  client = undefined
}

export const middleware = store => next => action => {
    const dispatcher = action => evt => {
      console.log({action: action.toString(), evt})
      return store.dispatch(action(evt))
    }

    switch(action.type) {
    case connect.getType():
      closeClient()
      const { url, observe: obs='none' } = action.payload
      client = new ArraiClient(url, obs)
      client.onopen = dispatcher(onopen)
      client.onclose = dispatcher(onclose)
      client.onupdate = dispatcher(onupdate)
      client.onerror = dispatcher(onerror)
      break
    case close.getType():
      closeClient()
      break
    case update.getType():
      client.update(JSON.stringify(action.payload))
      break
    case observe.getType():
      client.observe(JSON.stringify(action.payload))
      break
    default:
      return next(action)
  }
}

export const reducer = createReducer({
  [onopen]: state => ({ ...state, connected: true }),
  [onclose]: state => ({ ...state, connected: false }),
  [onupdate]: (state, payload) => console.log({ state, payload })||({ ...state, ...payload }),
}, {})
