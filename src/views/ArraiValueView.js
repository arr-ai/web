import React from 'react'
import { Table } from 'semantic-ui-react'
import { ArraiType } from 'arr.ai'
import { ReactView } from 'arr.ai-react'

import tinycolor from 'tinycolor2'

import checker from '../../public/checker.png'

const newline = i => <span key={i} style={{color: 'silver'}}>↵{'\n'}</span>
const xmlnsNS = '{http://www.w3.org/2000/xmlns/}'

const rootNSes = {
  '': '',
  'xml': 'https://www.w3.org/XML/1998/namespace',
  'xmlns': xmlnsNS.slice(1, -1)
}

function renderCDATA(text, indent) {
  return <span>
    {text.split(/(\n)/).map((line, i) =>
      i % 2 ? newline(i)
      : <span key={i}>
        {i ? indent : ''}
        {line.split(/(\s+)/).map((part, i) =>
          i % 2
          ? <span key={i} style={{color: 'silver', fontWeight: 'x-light'}}>
            {part.replace(/ /g, '·').replace(/\t/g, '→')}
          </span>
          : <span key={i}>{part}</span>
        )}
      </span>
    )}
  </span>
}

function reverseMap(object) {
  const robject = {}
  for (const key of Object.keys(object)) {
    robject[object[key]] = key
  }
  return robject
}

function aliased(name, rmap) {
  const m = name.match(/^(?:{(.*)})?(.*)$/)
  if (m[1] === undefined) {
    return name
  }
  const alias = rmap[m[1]]
  if (alias === '') {
    return m[2]
  }
  return alias + ':' + m[2]
}

function applyNSAttrs(nses, attrs) {
  nses = Object.assign({}, nses)
  for (const key of Object.keys(attrs)) {
    if (key === 'xmlns') {
      nses[''] = attrs[key]
    } else if (key.startsWith(xmlnsNS)) {
      nses[key.slice(xmlnsNS.length)] = attrs[key]
    }
  }
  return nses
}

function renderXML(value, indent, nses) {
  switch (typeof value) {
    case 'number':
      return ['{', JSON.stringify(value), '}']
    case 'boolean':
      return value ? 'true' : 'none'
    case 'string':
      return renderCDATA(value, indent)
    default:;
  }

  const xml = value['@xml']
  if (xml) {
    if (nses === undefined) {
      nses = rootNSes
    }

    const tag = xml['tag']
    const attrs = xml['attributes'] || {}
    const children = xml['children'] || []

    nses = applyNSAttrs(nses, attrs)
    const rmap = reverseMap(nses)
    const openTag = <span>
      <b>&lt;</b>
      <span style={{color: '#909'}}>{aliased(tag, rmap)}</span>
      {Object.keys(attrs).map(name =>
        <span key={name}>
          {' '}{aliased(name, rmap)}={renderArrai(attrs[name], indent + '  ').vdom}
        </span>
      )}
    </span>
    if (!children.length) {
      return <span>{openTag}<b>/&gt;</b></span>
    }
    if (children.size === -1) {
      return <span>{openTag}
        <b>&gt;</b>
        {renderXML(children[0], indent, nses)}
        <b>&lt;/</b>
        <span style={{color: '#909'}}>{aliased(tag, rmap)}</span>
        <b>&gt;</b>
      </span>
    }
    const indent2 = indent + '  '
    return <span>{openTag}
      <b>&gt;</b>
      {children.map((v, i) =>
        <span key={i}>
          {i ? indent2
            : typeof v !== 'string' || v[0] !== '\n'
              ? <span>{'\n'}{indent2}</span> : ''}
          {renderXML(v, indent2, nses)}
          {'\n'}
        </span>
      )}
      {indent}
      <b>&lt;/</b>
      <span style={{color: '#909'}}>{aliased(tag, rmap)}</span>
      <b>&gt;</b>
    </span>
  }
}

function renderArrai(value, indent) {
  const indent2 = indent + '  '

  switch (ArraiType(value)) {
    case 'number':
      return {
        vdom: <span style={{color: '#36f'}}>{value}</span>,
        w: String(value).length,
        h: 1,
      }
    case 'boolean':
      return {vdom: value ? 'true' : 'none', w: 4, h: 1}
    case 'string': {
      const color = tinycolor(value)
      if (color.isValid()) {
        return {
          vdom: (
            <span style={{color: '#33c833'}}>
              {'"'}
              <span style={{
                margin: '0px 2px',
                backgroundImage: `url(${checker})`,
                backgroundPosition: 'center'
              }}>
                <span style={{
                  padding: '0px 3px',
                  backgroundColor: color.toString(),
                  border: '1px solid ' + color.darken().setAlpha(1).toString()
                }}>
                  &nbsp;
                </span>
              </span>
              {value}
              {'"'}
            </span>
          ),
          w: Infinity,
          h: 1,
        }
      }
      const repr = JSON.stringify(value)
      return {
        vdom: <span style={{color: '#33c833'}}>{repr}</span>,
        w: repr.length,
        h: 1,
      }
    }
    case 'function': {
    // const {arg, expr} = value[ArraiFunc];
    // return <span><b>{arg}</b>{expr}</span>;
      const repr = String(value)
      return {vdom: <span><b>{repr}</b></span>, w: repr.length, h: 1}
    }
    case 'array': {
      if (value.length === 0) {
        return {vdom: <b>[]</b>, w: 2, h: 1}
      }
      if (value.length === 1) {
        const { vdom, w, h } = renderArrai(value[0], indent)
        if (h === 1) {
          return {vdom: <span><b>[</b>{vdom}<b>]</b></span>, w: 2 + w, h}
        }
      }
      const elems = value.map(v => renderArrai(v, indent2))
      return {
        vdom: (
          <span>
            <b>[</b>{'\n'}
            {elems.map((v, i) => <span key={i}>{indent2}{v.vdom},{'\n'}</span>)}
            {indent}<b key='1'>]</b>
          </span>
        ),
        w: elems.reduce((a, v) => Math.max(v.w, a), 0),
        h: elems.reduce((a, v) => v.h + a, 0),
      }
    }
    case 'set': {
      if (value.length === 0) {
        return {vdom: 'none', w: 4, h: 1}
      }
      if (value.length !== 0 && ArraiType(value[0]) === 'tuple') {
        const attrs = Object.keys(value[0]).sort()
        return {
          vdom: (
            <Table celled
                style={{
                  display: 'inline-block',
                  verticalAlign: 'top',
                  margin: '0 2px 2px',
                  width: 'initial',
                }}>
              <Table.Header>
                <Table.Row>
                  {attrs.map((attr, i) => (
                    <Table.HeaderCell key={i}
                        style={{padding: '2px', textAlign: 'center'}}>
                      {attr}
                    </Table.HeaderCell>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {value.map((tuple, i) => (
                  <Table.Row key={i}>
                    {attrs.map((attr, i) => (
                      <Table.Cell key={i} style={{padding: '2px 4px'}}>
                        <ArraiValueView value={tuple[attr]} />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ),
          w: Infinity,
          h: Infinity,
        }
      }
      if (value.length === 1) {
        const { vdom, w, h } = renderArrai(value[0], indent2)
        if (h === 1) {
          return {
            vdom: <span><b>{'{|'}</b>{vdom}<b>{'|}'}</b></span>,
            w: 4 + w,
            h: 1,
          }
        }
      }
      return {
        vdom: (
          <span>
            <b>{'{|'}</b>{'\n'}
            {value.map((v, i) => <span key={i}>
              {indent2}{renderArrai(v, indent2).vdom},{'\n'}
            </span>)}
            {indent}<b>|}</b>
          </span>
        ),
        w: Infinity,
        h: Infinity,
      }
    }
    case 'tuple': {
      const keys = Object.keys(value)
      if (keys.length === 0) {
        return {vdom: '{}', w: 2, h: 1}
      }

      if (keys.length === 1) {
        const key = keys[0]
        const attr = value[key]
        if (key === '@xml') {
          return {vdom: renderXML(value, indent), w: Infinity, h: Infinity}
        }
        const { vdom, w, h } = renderArrai(attr, indent2)
        if (h === 1) {
          return {
            vdom: (
              <span>
                <b>{'{'}</b>
                {key[0] === '&' ? <span style={{color: 'orange'}}>&amp;</span> : []}
                <span style={{color: '#666'}}>{key}</span>
                <b>: </b>
                {vdom}
                <b>{'}'}</b>
              </span>
            ),
            w: 4 + keys[0].length + w,
            h: 1,
          }
        }
      }

      const maxLength = keys.reduce((a, name) => Math.max(a, name.length), 0)
      const padding = ' '.repeat(maxLength)
      const indent3 = indent2 + '  '
      return {
        vdom: (
          <span>
            <b>{'{'}</b>{'\n'}
            {keys.map(name => {
              const attr = value[name]
              if (name[0] === '&') {
                return <span key={name}>
                  {indent2}
                  <span style={{color: 'orange'}}>&amp;</span>
                  <span style={{color: '#666'}}>
                    {(name.slice(1) + padding).slice(0, maxLength - 1)}
                  </span>
                  <b>: </b>
                  {renderArrai(attr, indent3).vdom},{'\n'}
                </span>
              }
              return <span key={name}>
                {indent2}
                <span style={{color: '#666'}}>
                  {(name + padding).slice(0, maxLength)}
                </span>
                <b>: </b>
                {renderArrai(attr, indent3).vdom},{'\n'}
              </span>
            })}
            {indent}<b>{'}'}</b>
          </span>
        ),
        w: Infinity,
        h: Infinity,
      }
    }
    default:;
    console.log('Unexpected value:', value, ArraiType(value))
    throw new Error('Unexpected value: ' + value)
  }
  // case 'set:view':
  //   return <span><b>&amp;</b> {value['{||}']['&']}</span>;
}

export default function ArraiValueView(props) {
  const { value, actions } = props

  if (typeof value === 'object' && '@xml' in value) {
    return (
      <div style={{marginLeft: '0.5rem', marginTop: '0.5rem'}} {...props}>
        <ReactView value={value} actions={actions} />
      </div>
    )
  }
  return (
    <div style={{margin: 0}} {...props}>
      <pre>{renderArrai(value, '').vdom}</pre>
    </div>
  )
}
