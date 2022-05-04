/**************************************************************************************************************************************/

/**************************************************************************************************************************************/
var record = document.getElementById("record");
var stop = document.getElementById("stop");
var play = document.getElementById("play");
var leftchannel = [];
var rightchannel = [];
var recorder = null;
var recordingLength = 0;
var volume = null;
var mediaStream = null;
var sampleRate = 44100;
var context = null;
var blob = null;
var text_conn = "";
var remote_id = "";
var cam_act = false;
//****

var peer = new Peer({
  host: "http://peer-peerjs.44fs.preview.openshiftapps.com", // 'localhost',
  port: 9001,
  path: "/peerjs", //peerjs
  //bindIp:'127.0.0.1',
  debug: 3,
  /*config: {'iceServers': [
    { url: 'stun:stun1.l.google.com:19302' },
    { url: 'turn:numb.viagenie.ca',
      credential: 'muazkh', username: 'webrtc@live.com' }
    ]}*/
});

var remotesIDs = [];
var connections = [];
var color = "white";
var admin = null;
var messages = [];
var peer_id, name, conn, peerid;
var messages_template; //= Handlebars.compile(""+$('#messages-template').html());
//******
$(function () {
  function auto_load() {
    $.ajax({
      url: "http://peer-peerjs.44fs.preview.openshiftapps.com/logs",
      cache: false,
      success: function (data) {
        // var i;

        var htm = "";
        admin = data.adm;

        if (data.con != null) {
          var c = data.con;
          for (i = 0; i < c.length; i++) {
            // console.log('name : '+ data[i].name);
            if (c[i].peerid != peer.id) {
              htm +=
                "<br> <button style='color : " +
                color +
                ";' id='c" +
                c[i].peerid +
                "'  onclick=coun('" +
                c[i].peerid +
                "') disabled>" +
                "CONNECT " +
                c[i].name +
                "</button>";
              //console.log(htm);
            }
          }
        }
        $("#connected_peer").html(htm);

        if (admin != null && admin.peerid != peer.id) {
          $("#myadmin").text("Your admin is : " + admin.name);
        }
      }, //data
    });
    //alert('works');
  }

  $(document).ready(function () {
    auto_load(); //Call auto_load() function when DOM is Ready
    // console.log('id '+peer.id);
    //document.getElementById(peer.id).addClass('hidden');
  });

  //Refresh auto_load() function after 10000 milliseconds
  setInterval(auto_load, 2000);

  //declaration

  messages_template = Handlebars.compile($("#messages-template").html());

  peer.on("open", function () {
    $("#id").text(peer.id);

    //alert(peer.id);
  });

  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.mediaDevices.getUserMedia;

  function getVideo(callback) {
    navigator.getUserMedia(
      { audio: false, video: true },
      callback,
      function (error) {
        console.log(error);
        alert("An error occured. Please try again");
      }
    );
  }

  getVideo(function (stream) {
    window.localStream = stream;
    var data = { strea: stream, peerid: peer.id };
    onReceiveStream(data, "my-camera");
  });
  function onReceiveStream(data, element_id) {
    var video = $("#" + element_id + " video")[0];
    video.src = window.URL.createObjectURL(data.strea);
    window.peer_stream = data.strea;
    console.log("peeridd of stream = " + data.peerid);
  }

  // login
  $("#login").click(function () {
    // wooorks
    name = $("#name").val();
    // peer_id = $('#peer_id').val();

    peerid = document.getElementById("id").innerHTML;
    //alert('name : '+name+' - '+peerid);

    var who = "";

    $("#connect").addClass("hidden");
    $("#chat").removeClass("hidden");

    //text_conn+="<br> "+name+" -  <button id='"+ peerid+"'>"+peerid+"</button>" ;
    //document.getElementById('connected_peer').innerHTML = text_conn;

    /*	var xhttp = new XMLHttpRequest();
			  xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
				 // document.getElementById('connected_peer').innerHTML = xhttp.responseText;
					}
				};
				var ur = "http://localhost:8081/addname?name="+name+"&peer="+peerid;
			  xhttp.open("GET", ur, true);
			  xhttp.send();	
			  //alert('work');
	*/
    $.ajax({
      url:
        "http://peer-peerjs.44fs.preview.openshiftapps.com/addname?name=" +
        name +
        "&peer=" +
        peerid,
      cache: false,
      success: function (data) {
        // var i;

        who = data;
        console.log("who = " + data);

        $("#myname").text(" :  " + name + "" + who);
      }, //function data success
    }); // ajax

    function wait(ms) {
      var start = new Date().getTime();
      var end = start;
      while (end < start + ms) {
        end = new Date().getTime();
      }
    }
    //wait(500);

    if (admin != null && peer.id != admin.peerid) {
      console.log("connecting to admin : " + admin.name + " ...");
      conn = peer.connect(admin.peerid);
      handleConnection(conn);
    }

    //document.getElementById('my-camera').innerHTML="Hello " +name+" !";
    //$('#my-camera').text(name);
    //$('#myname').text(" :  "+name +""+who );
  });

  peer.on("connection", function (connection) {
    conn = connection;
    peer_id = connection.peer;
    //conn.on('data', handleMessage);
    handleConnection(conn);

    //$('#peer_id').addClass('hidden').val(peer_id);
    //  $('#connected_peer_container').removeClass('hidden');

    // $('#connected_peer').text();
  });

  // handle connection
  function handleConnection(conn) {
    remotesIDs.push(conn.peer);

    conn.on("open", function () {
      if (peer.id != admin.peerid) {
        console.log("Connected with admin: " + admin.name + " successful !");
        var call = peer.call(admin.peerid, window.localStream);
        call.on("stream", function (stream) {
          window.peer_stream = stream;
          var data = { strea: stream, peerid: peer.id };
          onReceiveStream(data, "peer-camera");
        });
      }
    });
    conn.on("data", handleMessage);
  }

  // handle message
  function handleMessage(data) {
    var header_plus_footer_height = 444;
    var base_height = $(document).height() - header_plus_footer_height;
    var messages_container_height = $("#messages-container").height();
    messages.push(data);

    var html = messages_template({ messages: messages });
    $("#messages").html(html);
    // console.log('docuement height : ' +$(document).height() +' header_plus_footer_height : ' +header_plus_footer_height)
    //console.log('container heigh : '+messages_container_height +' and base height ' + base_height )
    if (messages_container_height >= base_height) {
      $("html, body").animate({ scrollTop: $(document).height() }, 500);

      //window.scrollTo(0, 500);
      var elem = document.getElementById("messages-container");
      elem.scrollTop = elem.scrollHeight;
      console.log("in animation ");
    }
  }

  function sendMessage() {
    var text = $("#message").val();
    var data = { from: name, text: text };

    conn.send(data);
    handleMessage(data);
    $("#message").val("");
  }

  $("#message").keypress(function (e) {
    if (e.which == 13) {
      sendMessage();
    }
  });

  $("#send-message").click(sendMessage);

  $("#call").click(function () {
    console.log("now calling: " + remote_id);
    //console.log(peer);
  });

  peer.on("call", function (call) {
    onReceiveCall(call);
  });

  function onReceiveCall(call) {
    call.answer(window.localStream);
    call.on("stream", function (stream) {
      window.peer_stream = stream;

      console.log(
        "********************************  number of connected people to you admin are  : " +
          remotesIDs.length
      );

      var htm = "";

      for (var i = 0; i < remotesIDs.length; i++) {
        var idd = remotesIDs[i];
        htm +=
          " <div id='peer-camera" +
          idd +
          "' class='camera' style='display : inline;'>  <video width='300' height='200' autoplay></video>  </div>";
        var elementid = "peer-camera" + idd;
        console.log("element id  = " + elementid);
      }

      $("#create").html(htm);
      for (var i = 0; i < remotesIDs.length; i++) {
        var elementid = "peer-camera" + remotesIDs[i];
        var data = { strea: stream, peerid: remotesIDs[i] };
        onReceiveStream(data, elementid);
      }
    });
  }

  $("#voice").click(function () {
    document.getElementById("voice").style.color = "red";

    record.addEventListener("click", function () {
      // Initialize recorder
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
      navigator.getUserMedia(
        {
          audio: true,
        },
        function (e) {
          console.log("user consent");
          // creates the audio context
          window.AudioContext =
            window.AudioContext || window.webkitAudioContext;
          context = new AudioContext();
          // creates an audio node from the microphone incoming stream
          mediaStream = context.createMediaStreamSource(e);
          // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
          // bufferSize: the onaudioprocess event is called when the buffer is full
          var bufferSize = 2048;
          var numberOfInputChannels = 2;
          var numberOfOutputChannels = 2;
          if (context.createScriptProcessor) {
            recorder = context.createScriptProcessor(
              bufferSize,
              numberOfInputChannels,
              numberOfOutputChannels
            );
          } else {
            recorder = context.createJavaScriptNode(
              bufferSize,
              numberOfInputChannels,
              numberOfOutputChannels
            );
          }
          recorder.onaudioprocess = function (e) {
            leftchannel.push(new Float32Array(e.inputBuffer.getChannelData(0)));
            rightchannel.push(
              new Float32Array(e.inputBuffer.getChannelData(1))
            );
            recordingLength += bufferSize;
          };
          // we connect the recorder
          mediaStream.connect(recorder);
          recorder.connect(context.destination);
        },
        function (e) {
          console.error(e);
        }
      );
    });
    stop.addEventListener("click", function () {
      // stop recording
      recorder.disconnect(context.destination);
      mediaStream.disconnect(recorder);
      // we flat the left and right channels down
      // Float32Array[] => Float32Array
      var leftBuffer = flattenArray(leftchannel, recordingLength);
      var rightBuffer = flattenArray(rightchannel, recordingLength);
      // we interleave both channels together
      // [left[0],right[0],left[1],right[1],...]
      var interleaved = interleave(leftBuffer, rightBuffer);
      // we create our wav file
      var buffer = new ArrayBuffer(44 + interleaved.length * 2);
      var view = new DataView(buffer);
      // RIFF chunk descriptor
      writeUTFBytes(view, 0, "RIFF");
      view.setUint32(4, 44 + interleaved.length * 2, true);
      writeUTFBytes(view, 8, "WAVE");
      // FMT sub-chunk
      writeUTFBytes(view, 12, "fmt ");
      view.setUint32(16, 16, true); // chunkSize
      view.setUint16(20, 1, true); // wFormatTag
      view.setUint16(22, 2, true); // wChannels: stereo (2 channels)
      view.setUint32(24, sampleRate, true); // dwSamplesPerSec
      view.setUint32(28, sampleRate * 4, true); // dwAvgBytesPerSec
      view.setUint16(32, 4, true); // wBlockAlign
      view.setUint16(34, 16, true); // wBitsPerSample
      // data sub-chunk
      writeUTFBytes(view, 36, "data");
      view.setUint32(40, interleaved.length * 2, true);
      // write the PCM samples
      var index = 44;
      var volume = 2;
      for (var i = 0; i < interleaved.length; i++) {
        view.setInt16(index, interleaved[i] * (0x7fff * volume), true);
        index += 2;
      }
      // our final blob
      blob = new Blob([view], { type: "audio/wav" });
      // heeeeeeeeeeeeeeeeeeeeeeeeeere ****************
      leftchannel = [];
      rightchannel = [];
      recorder = null;
      recordingLength = 0;
      volume = null;
      mediaStream = null;
      sampleRate = 44100;
      context = null;
      var blo = window.URL.createObjectURL(blob);
      conn.send(blo); //this one was added
    });
    play.addEventListener("click", function () {
      conn.on("data", function (data) {
        if (data == null) {
          alert("empty data");
          return;
        }

        var audio = new Audio(data);
        alert(data);
        audio.play();
      });
      alert("data = " + data);
    });

    function flattenArray(channelBuffer, recordingLength) {
      var result = new Float32Array(recordingLength);
      var offset = 0;
      for (var i = 0; i < channelBuffer.length; i++) {
        var buffer = channelBuffer[i];
        result.set(buffer, offset);
        offset += buffer.length;
      }
      return result;
    }
    function interleave(leftChannel, rightChannel) {
      var length = leftChannel.length + rightChannel.length;
      var result = new Float32Array(length);
      var inputIndex = 0;
      for (var index = 0; index < length; ) {
        result[index++] = leftChannel[inputIndex];
        result[index++] = rightChannel[inputIndex];
        inputIndex++;
      }
      return result;
    }
    function writeUTFBytes(view, offset, string) {
      for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
  });
});
