/**
 * @file 根证书二维码
 * @author zdying
 */
'use strict';

import React from 'react';

export default ({visible, url, onMouseEnter, onMouseLeave}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className='qrcode' onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <img src={window.jrQrcode.getQrBase64(url)} />
      <div>
        <h3>Download the root certificate</h3>
        <p>1. Scan the QR code to download the root certificate.</p>
        <p>2. Or <a href={url}>click here</a> to download directly.</p>
        <p><strong>Tips</strong>: You can <a href='http://hiproxy.org/configuration/ssl_certificate.html' target='_blank'>click here</a> to see how to install the configuration certificate</p>
      </div>
    </div>
  );
};
