import React from 'react'
import { connect } from 'react-redux'
import SyntaxHighlighter, { registerLanguage }
  from 'react-syntax-highlighter/dist/light'
import javascript from 'highlight.js/lib/languages/javascript'
import docco from 'react-syntax-highlighter/dist/styles/docco'

import * as reactChartJS from 'react-chartjs'
import * as reactGmaps from 'react-gmaps'
import * as reactNativeWeb from 'react-native-web'
import * as semanticUIReact from 'semantic-ui-react'

import { RegisterPackages } from 'arr.ai-react'

import ArraiValueView from './views/ArraiValueView'

import './App.css'

const { Label, Segment } = semanticUIReact

registerLanguage('javascript', javascript)

RegisterPackages({
  'react-chartjs': reactChartJS,
  'react-gmaps': reactGmaps,
  'react-native': reactNativeWeb,
  'semantic-ui-react': semanticUIReact,
})

function asString (value, space) {
  if (typeof space === 'number') {
    space = ' '.repeat(space)
  }

  function recurse (value, indent) {
    switch (typeof value) {
      case 'number': case 'string': case 'boolean':
        return JSON.stringify(value)
      case 'function':
        return String(value).replace(/\n/, '↵')
      default:;
    }

    if (value === null) {
      return 'null'
    }

    if (Object.prototype.toString.call(value) === '[object Array]') {
      if (value.length === 0) {
        return '[]'
      }

      const indent2 = indent + space
      let result = '[\n'
      for (const e of value) {
        result += indent2 + recurse(e, indent2) + ',\n'
      }
      return result + indent + ']'
    }

    const keys = Object.keys(value)
    if (keys.length === 0) {
      return '{}'
    }

    const indent2 = indent + space
    let result = '{\n'
    for (let key of keys) {
      const attr = recurse(value[key], indent2)
      if (!key.match(/[a-zA-Z$_][a-zA-Z$_0-9]*/)) {
        key = JSON.stringify(key)
      }
      result += indent2 + key + ': ' + attr + ',\n'
    }
    return result + indent + '}'
  }

  return recurse(value, '')
}

const divStyle = {
  display: 'flex',
  height: '100vh',
  flexDirection: 'column',
  overflow: 'hidden'
}

const segmentStyle = {
  margin: '0 1rem 1rem',
  padding: 0,
  flex: '8 8',
  display: 'flex',
  flexDirection: 'row',
  overflow: 'auto',
  background: 'rgb(248, 248, 255)',
}

export default connect(
  ({arrai}) => console.log({arrai})||({...arrai})
)(({ fmt, connected, error, value }) =>
  fmt === 'publish'
  ? value
    ? <ArraiValueView value={value} style={{margin: '1rem'}} />
    : <div />
  : <div style={divStyle}>
      <Segment style={segmentStyle}>
        <Label
          size='small'
          color={connected ? 'green' : 'red'}
          corner='right'
          icon='signal'
        />
        {
          !error ? []
          : <Label color='red' attached='bottom left'>
            {error}
          </Label>
        }
        {value === undefined ? <div />
        : fmt === 'json'
        ? <SyntaxHighlighter language='javascript' style={docco}>
            {asString(value, 2)}
          </SyntaxHighlighter>
        : <ArraiValueView value={value} style={{margin: '1rem'}} />
        }
      </Segment>
    </div>
)
