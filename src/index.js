import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import { routerForBrowser } from 'redux-little-router'
import createSagaMiddleware from 'redux-saga'
import { put } from 'redux-saga/effects'

import App from './App'

import { middleware as arraiMiddleware, connect, reducer as arraiReducer } from './comms/arrai'

import 'pure-semantic-ui-css/semantic.css'
import './index.css'

const loc = window.location

const arraiURL = process.env.REACT_APP_WS_URL || (
  `${loc.protocol.replace(/^http/, 'ws')}//${loc.host}/.__ws__`)

const router = routerForBrowser({
  routes: {
    '/': {
      title: 'Home',
    }
  },
})

const sagaMiddleware = createSagaMiddleware()

const store = createStore(
  combineReducers({
    router: router.reducer,
    arrai: arraiReducer,
  }),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
  compose(
    router.enhancer,
    applyMiddleware(
      router.middleware,
      sagaMiddleware,
      arraiMiddleware,
    ),
  )
)

sagaMiddleware.run(function * () {
  const search = window.location.search.slice(3)
  console.log({search})
  yield put(connect({ url: arraiURL, observe: decodeURI(search) || '$' }))
})

// arrai.onopen = () => {
//   this.setState({connected: true})
// }

// arrai.onclose = () => {
//   this.setState({connected: false})
// }

// arrai.onupdate = this.setState

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'),
)
