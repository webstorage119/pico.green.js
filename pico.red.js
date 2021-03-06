function PicoRed(options){

  // config
  options                = options || {};
  var mode               = options.mode || 'vga';
  var cascade_url        = options.cascade_url || 'https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder';
  var min_face_score     = options.min_face_score || 50.0;     // score not percent
  var min_detect_size    = options.min_detect_size || 60;      // px, start draw yellow rect
  var min_recognize_size = options.min_recognize_sizse || 100; // px, start draw green rect
  var draw_video_fn      = options.draw_video_fn || function(ctx, video){ ctx.drawImage(video, 0, 0); };
  var end_of_frame_fn    = options.end_of_frame_fn || function(ctx, video, detected_faces){ /* default: do nothing */ };
  var last_n_frames      = options.last_n_frames || 5; // use the detecions of the last 5 frames

  // get video canvas
  var video_canvas  = options.canvas_id
                    ? document.getElementById(options.canvas_id)
                    : document.getElementsByTagName('canvas')[0];

  // tools
  var b64blank = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  function extract_face_from_canvas(src_canvan, det){
    var hidden_canvas = document.createElement('canvas');
    var scale = det[2];
    var x = det[1] - (scale/2);
    var y = det[0] - (scale/2);
    var w = scale;
    var h = scale;
    hidden_canvas.width = w;
    hidden_canvas.height = h;
    hidden_canvas.getContext('2d').drawImage(src_canvan, x, y, w, h, 0, 0, w, h);
    return hidden_canvas.toDataURL();
  };
  function draw_style(ctx, color){
    color = color || 'yellow';
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  function draw_circle(ctx, det, color){
    ctx.arc(det[1], det[0], det[2]/2, 0, 2*Math.PI, false);
    draw_style(ctx, color);
  }
  function draw_rect(ctx, det, color){
    var w = det[2]
    ctx.rect(det[1]-(w/2), det[0]-(w/2), w, w);
    draw_style(ctx, color);
  }

  // initialize pico
  /*
    (1) prepare the pico.js face detector
  */
  var update_memory = pico.instantiate_detection_memory(last_n_frames); // we will use the detecions of the last 5 frames
  var facefinder_classify_region = function(r, c, s, pixels, ldim) {return -1.0;};
  fetch(cascade_url).then(function(response) {
    response.arrayBuffer().then(function(buffer) {
      var bytes = new Int8Array(buffer);
      facefinder_classify_region = pico.unpack_cascade(bytes);
      console.log('* cascade loaded');
    })
  })
  /*
    (2) get the drawing context on the canvas and define a function to transform an RGBA image to grayscale
  */
  // var ctx = video_canvas.getContext('2d');
  function rgba_to_grayscale(rgba, nrows, ncols) {
    var gray = new Uint8Array(nrows*ncols);
    for(var r=0; r<nrows; ++r)
      for(var c=0; c<ncols; ++c)
        // gray = 0.2*red + 0.7*green + 0.1*blue
        gray[r*ncols + c] = (2*rgba[r*4*ncols+4*c+0]+7*rgba[r*4*ncols+4*c+1]+1*rgba[r*4*ncols+4*c+2])/10;
    return gray;
  }

  /*
    (3) this function is called each time a video frame becomes available
  */
  this.draw_fn = function(ctx, video) {
    // extract canvas width, height
    var cv_width = ctx.canvas.width;
    var cv_height = ctx.canvas.height;
    // render the video frame to the canvas element and extract RGBA pixel data

    // every frame, draw video on canvas
    draw_video_fn(ctx, video);

    var rgba = ctx.getImageData(0, 0, cv_width, cv_height).data;
    // prepare input to `run_cascade`
    image = {
      "pixels": rgba_to_grayscale(rgba, cv_height, cv_width),
      "nrows": cv_height,
      "ncols": cv_width,
      "ldim": cv_width
    }
    params = {
      "shiftfactor": 0.1, // move the detection window by 10% of its size
      "minsize": min_detect_size, // minimum size of a face
      "maxsize": 1000,    // maximum size of a face
      "scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
    }
    // run the cascade over the frame and cluster the obtained detections
    // dets is an array that contains (r, c, s, q) quadruplets
    // (representing row, column, scale and detection score)
    dets = pico.run_cascade(image, facefinder_classify_region, params);
    dets = update_memory(dets);
    dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2

    // reset some stuffs
    window.detected_faces = [];

    // loop over-threshold data
    dets.filter(function(det){
      return det[3] > min_face_score;
    }).forEach(function(det, i){
      if(det[2] < min_recognize_size){
        // only draw rect if face not big enough
        ctx.beginPath();
        draw_rect(ctx, det);
      }
      else {
        // extract detected face to base64 string
        var b64img = extract_face_from_canvas(ctx.canvas, det);

        // keep in detected_faces
        window.detected_faces.push(b64img);

        // draw detection line
        ctx.beginPath();
        draw_rect(ctx, det, 'lime');
      }
    });

    // end of each video frame
    // fastest place to do process with detected faces
    end_of_frame_fn(ctx, video, window.detected_faces);
  }
}
