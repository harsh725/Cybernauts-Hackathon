function backfun() {

}
function boyleave() {
  
}




console.log("agora sdk version: " + AgoraRTC.VERSION + " compatible: " + AgoraRTC.checkSystemRequirements());
    var resolutions = [
      {
        name: "default",
        value: "default",
      },
      {
        name: "480p",
        value: "480p",
      },
      {
        name: "720p",
        value: "720p",
      },
      {
        name: "1080p",
        value: "1080p"
      }
    ]
    
    function addView (id, show) {
      if (!$("#" + id)[0]) {
        $("<div/>", {
          id: "remote_video_panel",
        }).appendTo("#video")

        $("<div/>", {
          id: "remote_video_" + id,
          class: "video-placeholder",
        }).appendTo("#remote_video_panel")

        $("<div/>", {
          id: "remote_video_info_" + id,
          class: "video-profile " + (show ? "" :  "hide"),
        }).appendTo("#remote_video_panel_" + id)

        $("<div/>", {
          id: "video_autoplay_"+ id,
          class: "autoplay-fallback hide",
        }).appendTo("#remote_video_panel_" + id)
      }
    }
    function removeView (id) {
      if ($("#remote_video_panel_" + id)[0]) {
        $("#remote_video_panel_"+id).remove()
      }
    }

    function getDevices (next) {
      AgoraRTC.getDevices(function (items) {
        items.filter(function (item) {
          return ["audioinput", "videoinput"].indexOf(item.kind) !== -1
        })
        .map(function (item) {
          return {
          name: item.label,
          value: item.deviceId,
          kind: item.kind,
          }
        })
        var videos = []
        var audios = []
        for (var i = 0; i < items.length; i++) {
          var item = items[i]
          if ("videoinput" == item.kind) {
            var name = item.label
            var value = item.deviceId
            if (!name) {
              name = "camera-" + videos.length
            }
            videos.push({
              name: name,
              value: value,
              kind: item.kind
            })
          }
          if ("audioinput" == item.kind) {
            var name = item.label
            var value = item.deviceId
            if (!name) {
              name = "microphone-" + audios.length
            }
            audios.push({
              name: name,
              value: value,
              kind: item.kind
            })
          }
        }
        next({videos: videos, audios: audios})
      })
    }

    var rtc = {
      client: null,
      joined: false,
      published: false,
      localStream: null,
      remoteStreams: [],
      params: {}
    }

    function handleEvents (rtc) {
      rtc.client.on("error", (err) => {
        console.log(err)
      })
      rtc.client.on("peer-leave", function (evt) {
        var id = evt.uid;
        console.log("id", evt)
        let streams = rtc.remoteStreams.filter(e => id !== e.getId())
        let peerStream = rtc.remoteStreams.find(e => id === e.getId())
        if(peerStream && peerStream.isPlaying()) {
          peerStream.stop()
        }
        rtc.remoteStreams = streams
        if (id !== rtc.params.uid) {
          removeView(id)
        }
        console.log("peer-leave", id)
        boyleave();
      })
      rtc.client.on("stream-published", function (evt) {
        console.log("stream-published")
      })
      rtc.client.on("stream-added", function (evt) {  
        var remoteStream = evt.stream
        var id = remoteStream.getId()
        if (id !== rtc.params.uid) {
          rtc.client.subscribe(remoteStream, function (err) {
            console.log("stream subscribe failed", err)
          })
        }
        console.log("stream-added remote-uid: ", id)
      })
      rtc.client.on("stream-subscribed", function (evt) {
        var remoteStream = evt.stream
        var id = remoteStream.getId()
        rtc.remoteStreams.push(remoteStream)
        addView(id)
        remoteStream.play("remote_video_" + id)
        console.log("stream-subscribed remote-uid: ", id)
      })
      rtc.client.on("stream-removed", function (evt) {
        var remoteStream = evt.stream
        var id = remoteStream.getId()
        if(remoteStream.isPlaying()) {
          remoteStream.stop()
        }
        rtc.remoteStreams = rtc.remoteStreams.filter(function (stream) {
          return stream.getId() !== id
        })
        removeView(id)
        console.log("stream-removed remote-uid: ", id)
      })
      rtc.client.on("onTokenPrivilegeWillExpire", function(){
        console.log("onTokenPrivilegeWillExpire")
      })
      rtc.client.on("onTokenPrivilegeDidExpire", function(){
        console.log("onTokenPrivilegeDidExpire")
      })
    }

    function join (rtc, option) {
      if (rtc.joined) {
        return;
      }
      rtc.client = AgoraRTC.createClient({mode: option.mode, codec: option.codec})

      rtc.params = option

      handleEvents(rtc)

      rtc.client.init(option.appID, function () {
        console.log("init success")

        
        rtc.client.join(option.token ? option.token : null, option.channel, option.uid ? +option.uid : null, function (uid) {
          console.log("join channel: " + option.channel + " success, uid: " + uid)
          rtc.joined = true

          rtc.params.uid = uid

          
          rtc.localStream = AgoraRTC.createStream({
            streamID: rtc.params.uid,
            audio: true,
            video: false,
            screen: false,
            microphoneId: option.microphoneId,
            cameraId: option.cameraId
          })

          
          rtc.localStream.init(function () {
            console.log("init local stream success")
            
            rtc.localStream.play("local_stream")

            
            publish(rtc)
          }, function (err)  {
            console.error("init local stream failed ", err)
          })
        }, function(err) {
          console.error("client join failed", err)
        })
      }, (err) => {
        console.error(err)
      })
    }

    function publish (rtc) {
      if (!rtc.client) {
 
        return
      }
      if (rtc.published) {
 
        return
      }
      var oldState = rtc.published

      rtc.client.publish(rtc.localStream, function (err) {
        rtc.published = oldState
        console.log("publish failed")
 
        console.error(err)
      })
      rtc.published = true
    }

    function unpublish (rtc) {
      if (!rtc.client) {
 
        return
      }
      if (!rtc.published) {
 
        return
      }
      var oldState = rtc.published
      rtc.client.unpublish(rtc.localStream, function (err) {
        rtc.published = oldState
        console.log("unpublish failed")
 
        console.error(err)
      })
      rtc.published = false
    }

    function leave (rtc) {
      if (!rtc.client) {
        return
      }
      if (!rtc.joined) {
        return
      }
      rtc.client.leave(function () {
        if(rtc.localStream.isPlaying()) {
          rtc.localStream.stop()
        }
        rtc.localStream.close()
        for (let i = 0; i < rtc.remoteStreams.length; i++) {
          var stream = rtc.remoteStreams.shift()
          var id = stream.getId()
          if(stream.isPlaying()) {
            stream.stop()
          }
          removeView(id)
        }
        rtc.localStream = null
        rtc.remoteStreams = []
        rtc.client = null
        console.log("client leaves channel success")
        rtc.published = false
        rtc.joined = false
      }, function (err) {
        console.log("channel leave failed")
        console.error(err)
      })
    }

    
    $(function () {
      getDevices(function (devices) {
        devices.audios.forEach(function (audio) {
          $("<option/>", {
            value: audio.value,
            text: audio.name,
          }).appendTo("#microphoneId")
        })
        devices.videos.forEach(function (video) {
          $("<option/>", {
            value: video.value,
            text: video.name,
          }).appendTo("#cameraId")
        })
        resolutions.forEach(function (resolution) {
          $("<option/>", {
            value: resolution.value,
            text: resolution.name
          }).appendTo("#cameraResolution")
        })
        M.AutoInit()
      })

      var fields = ["appID", "channel"]

      console.log("join")
      var params = {
      appID: "573735a311084ab3829d3ff02f24d1aa",
    cameraId: "",
    cameraResolution: "default",
    channel: "test",
    codec: "h264",
    microphoneId: "",
    mode: "rtc",
    token: "",
    uid: ""
      }
      console.log(params)
      join(rtc, params)

      $("#leave").on("click", function (e) {
        console.log("leave")
        e.preventDefault()
        var params = {
          appID: "573735a311084ab3829d3ff02f24d1aa",
      cameraId: "",
      cameraResolution: "default",
      channel: "test",
      codec: "h264",
      microphoneId: "",
      mode: "rtc",
      token: "",
      uid: ""
        }
        leave(rtc)
      })
    })