import React from 'react';
import $ from 'jquery';
export default class UdpPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      earlyCandidates: [],
      pc: undefined
    }
  }
  componentDidMount() {
    var self = this;
    let config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    let earlyCandidates = [];
    //{urls: 'stun:stun.l.google.com:19302'  }
    const pc = new RTCPeerConnection(config, { "optional": [{ "DtlsSrtpKeyAgreement": true }] });

    window.pc = pc
    pc.peerid = Math.random()
    console.log(pc)
    function isSafari() {
      return browser() === 'safari';
    }
    function browser() {
      const ua = window.navigator.userAgent.toLocaleLowerCase();

      if (ua.indexOf('edge') !== -1) {
        return 'edge';
      } else if (ua.indexOf('chrome') !== -1 && ua.indexOf('edge') === -1) {
        return 'chrome';
      } else if (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) {
        return 'safari';
      } else if (ua.indexOf('opera') !== -1) {
        return 'opera';
      } else if (ua.indexOf('firefox') !== -1) {
        return 'firefox';
      }
      return;
    }

    let log = msg => {
      document.getElementById('div').innerHTML += msg + '<br>'
    }

    pc.ontrack = function (event) {
      const [videoReceiver] = pc.getReceivers();
      // Add additional 500 milliseconds of buffering.
      //audioReceiver.playoutDelayHint = 0.5;
      //videoReceiver.playoutDelayHint = 10;
      console.log("ontrack")
      var el = document.createElement(event.track.kind)
      el.srcObject = event.streams[0]
      el.muted = true
      el.autoplay = true
      el.controls = true
      el.width = 600
      document.getElementById('remoteVideos').appendChild(el)



    }

    pc.oniceconnectionstatechange = function (evt) {
      console.log("oniceconnectionstatechange  state: " + pc.iceConnectionState);
      if (pc.iceConnectionState === "new") {
        getIceCandidate(bind)
      }
    }
    pc.onicecandidate = event => {
      console.log("onicecandidate")
      // if (event.candidate === null) {
      //   document.getElementById('localSessionDescription').value = btoa(pc.localDescription.sdp)
      //   var suuid = $('#suuid').val();
      //   $.post("/recive", { suuid: suuid,data:btoa(pc.localDescription.sdp)} ,function(data){
      //     document.getElementById('remoteSessionDescription').value = data
      //     window.startSession()
      //   });
      // }
      // else{
      //   earlyCandidates.push(event.candidate);
      // }
      if (event.candidate) {
        if (pc.currentRemoteDescription) {
          postCandidate(event.candidate);
        } else {
          earlyCandidates.push(event.candidate);
        }
      }
      else {
        console.log("End of candidates.");
        console.log("Local Description Finally:" + pc.localDescription.sdp)
        var suuid = $('#suuid').val();
        $.post("http://localhost:8083/recive", { suuid: suuid, data: btoa(pc.localDescription.sdp) }, function (data) {
          //console.log("data=>",data)
          document.getElementById('remoteSessionDescription').value = data
          self.startSession()
        });
      }
      this.setState({ earlyCandidates: earlyCandidates, pc: pc });
    }
    var postCandidate = candidate => {

      // $.post("/candidate", { suuid: suuid,data:JSON.stringify(candidate)},
      // function (response) { 
      //   if (response.statusCode === 200) {
      //     console.log("postCandidate ok:" + response.body);
      //   }
      //   else {
      //     console.log("postCandidate " +response.statusCode);
      //   }
      // })
    }

    var getIceCandidate = function () {
      var bind = this;
      $.get("/candidate/" + pc.peerid)
        .done(function (response) {
          //addRemoteCandidate(JSON.parse(response.body));
        }
        );
    }

    // var addRemoteCandidate = dataJson => {
    //   console.log("candidate: " + JSON.stringify(dataJson));
    //   if (dataJson) {
    //     for (var i = 0; i < dataJson.length; i++) {
    //       var candidate = new RTCIceCandidate(dataJson[i]);

    //       console.log("Adding ICE candidate :" + JSON.stringify(candidate));
    //       pc.addIceCandidate(candidate
    //         , function () { console.log("addIceCandidate OK"); }
    //         , function (error) { console.log("addIceCandidate error:" + JSON.stringify(error)); });
    //     }
    //     pc.addIceCandidate();
    //   }
    // }
    pc.addTransceiver('video', { 'direction': 'sendrecv' })
    pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false }).then(d => {
      pc.setLocalDescription(d).then(() => {
        document.getElementById('localSessionDescription').value = btoa(pc.localDescription.sdp)
        var suuid = $('#suuid').val();
        console.log("Local Description Initially:" + pc.localDescription.sdp)
        // $.post("/recive", { suuid: suuid,data:btoa(pc.localDescription.sdp)} ,function(data){
        //   document.getElementById('remoteSessionDescription').value = data
        //   window.startSession()
        // });
      })

    }).catch(log)

    // $(document).ready(function () {
    //   var suuid = $('#suuid').val();
    //   $('#' + suuid).addClass('active');
    // });
  }
  startUdpServer = (sourceId) => {
    $.post("http://localhost:8083/stream/" + sourceId, function (response) {
      //document.getElementById('remoteSessionDescription').value = data    
      console.log("create successed=>", response);
    });
  }
  stopUdpServer = (sourceId) => {
    //$.delete("/stream", { sourceId: sourceId });
    $.ajax({
      url: 'http://localhost:8083/stream/' + sourceId,
      type: 'DELETE',
      success: function (result) {
        // Do something with the result
      }
    });
  }
  startSession = () => {
    let sd = document.getElementById('remoteSessionDescription').value
    let pc = this.state.pc;
    let earlyCandidates = this.state.earlyCandidates;
    if (sd === '') {
      return alert('Session Description must not be empty')
    }
    try {
      pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: atob(sd) })).then(() => {
        while (earlyCandidates.length) {
          var candidate = earlyCandidates.shift();
          //postCandidate(candidate);
        }
        this.setState({ earlyCandidates: earlyCandidates, pc: pc })
        //setTimeout(getIceCandidate, 0);
      })
    } catch (e) {
      alert(e)
    }
  }
  render() {
    return (
      <div>
        <h2 style={{ alignSelf: "center" }}>Play Stream</h2>
        <div>
          <input type="hidden" name="suuid" id="suuid" value={this.props.suuid} />
          {/* <input type="hidden" name="port" id="port" value="{{ .port }}" /> */}
          <input type="hidden" id="localSessionDescription" readOnly="true" />
          <input type="hidden" id="remoteSessionDescription" />
          <div id="remoteVideos"></div>
          <button onClick={() => this.startSession()}> Start Session </button>
          <button onClick={() => this.startUdpServer(this.props.suuid)}> Start Udp Server </button>
          <button onClick={() => this.stopUdpServer(this.props.suuid)}> Stop Udp Server </button>
          <div id="div"></div>
        </div>
      </div>
    )
  }
}