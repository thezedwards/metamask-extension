import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { BrowserQRCodeReader } from '@zxing/library'
import adapter from 'webrtc-adapter' // eslint-disable-line import/no-nodejs-modules, no-unused-vars
import Spinner from '../../spinner'

export default class QrScanner extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    qrCodeDetected: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props, context) {
    super(props)
    this.state = {
      ready: false,
      msg: context.t('accessingYourCamera'),
    }
    this.scanning = false
    this.codeReader = null
  }

  componentDidMount () {
    console.log('[QR-SCANNER]: componentDidUpdate', this.scanning)
    if (!this.scanning) {
      this.scanning = true
      console.log('[QR-SCANNER]: componentDidUpdate - about to call initCamera')
      this.initCamera()
    }
  }

  initCamera () {
    console.log('[QR-SCANNER]: initCamera')
    this.codeReader = new BrowserQRCodeReader()
    this.codeReader.getVideoInputDevices()
      .then(videoInputDevices => {
        console.log('[QR-SCANNER]: initCamera::getVideoInputDevices', videoInputDevices)
        setTimeout(_ => {
          this.setState({
            ready: true,
            msg: this.context.t('scanInstructions')})
            console.log('[QR-SCANNER]: initCamera::ready')
        }, 2000)

        console.log('[QR-SCANNER]: initCamera::started decoding...')
        this.codeReader.decodeFromInputVideoDevice(videoInputDevices[0].deviceId, 'video')
        .then(content => {
          console.log('[QR-SCANNER]: initCamera::decodeFromInputVideoDevice callback', content)
          this.codeReader.reset()
          const result = this.parseContent(content.text)
          if (result.type !== 'unknown') {
            this.props.qrCodeDetected(result)
            this.stopAndClose()
          } else {
            this.setState({msg: this.context.t('unknownQrCode')})
          }
        })
        .catch(err => {
          console.error('QR-SCANNER: decodeFromInputVideoDevice threw an exception: ', err)
        })
      }).catch(err => {
        console.error('QR-SCANNER: getVideoInputDevices threw an exception: ', err)
      })
  }

  parseContent (content) {
    let type = 'unknown'
    let values = {}

    // Here we could add more cases
    // To parse other codes (transactions for ex.)

    if (content.split('ethereum:').length > 1) {
      type = 'address'
      values = {'address': content.split('ethereum:')[1] }
    }
    return {type, values}
  }


  stopAndClose = () => {
    this.codeReader.reset()
    this.scanning = false
    this.setState({ ready: false })
    this.props.hideModal()
  }

  render () {
    const { t } = this.context

    return (
      <div className="modal-container">
       <div className="modal-container__content">
          <div className="modal-container__title">
            { `${t('scanQrCode')}?` }
          </div>
          <div className="modal-container__description">
            <div
              className={'qr-code-video-wrapper'}
              style={{
                overflow: 'hidden',
                width: '100%',
                height: '275px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }
            }>
              <video
                id="video"
                style={{
                  width: 'auto',
                  height: '275px',
                  marginLeft: '-15%',
                  display: this.state.ready ? 'block' : 'none',
                  transform: 'scaleX(-1)',
                }}
              />
              { !this.state.ready ? <Spinner color={'#F7C06C'} /> : null}
            </div>
          </div>
        </div>
        <div className="modal-container__footer">
            {this.state.msg}
        </div>
      </div>
    )
  }
}