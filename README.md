# pico.green.js
Inject face detection to canvas draw function

## Additional libraries
* <a href='https://github.com/tehnokv/picojs'>pico.js</a> - face detection library
* <a href='https://github.com/diewland/camvas'>camvas</a> - render webcam to canvas ( custom edition )
* <a href='https://github.com/diewland/any2canvas.git'>any2canvas</a> - clone video/canvas to (another) canvas

## How to use
html
```html
<canvas></canvas>
```

javascript
```javascript
// green
var pg = new PicoGreen();
var camvas_obj = pg.init();

// red
var pr = new PicoRed();
var c2c = new Canvas2Canvas({
  draw_fn: pr.draw_fn,
});
```
## red ? What is the difference between green and red ?
* Detect face and draw rectangle on draw function ?
  * green - Yes
  * red - Yes
* Camvas build-in ?
  * green - Yes
  * red - No, bind webcam with any2canvas and inject pico.red draw function to a2c.
* Provide standalone draw function ?
  * green - No, already included in camvas build-in
  * red - Yes

## Configurations
```javascript
var myCamvas = new PicoGreen({ /* config as kv here */ });
var pr = new PicoRed({ /* config as kv here */ });
```
| Name               | Description                           | Type     | Default    |
| ------------------ | ------------------------------------- | -------- | ---------- |
| cascade_url        | Binary file for face detection        | String   | github url |
| min_face_score     | Face score threshold ( not percent )  | Float    | 50.0       |
| min_detect_size    | Min width to draw yellow rect (px)    | Int      | 60         |
| min_detect_size2   | Min width to draw green rect (px)     | Int      | 100        |
| last_n_frames      | use the detecions of the last N frames| Int      | 5          |

Camvas build-in

| Name               | Description                           | Type     | Default    | Values                        |
| ------------------ | ------------------------------------- | -------- | ---------- | ----------------------------- |
| mode               | Webcam profile ( green only )         | String   | vga        | qvga, vga, hd, fullhd, 4k, 8k |
| draw_video_fn      | run every frame: Draw video on canvas | Function | basic draw |                               |
| end_of_frame_fn    | run every frame: After filter faces   | Function |            |                               |
| draw_detect_fn     | run every frame: Draw detection       | Function |            |                               |
| draw_detect_fn2    | run every frame: Draw detection #2    | Function |            |                               |

## Demo

[Green](https://diewland.github.io/pico.green.js),
[Red](https://diewland.github.io/pico.green.js/red.html),
[Red #2](https://diewland.github.io/pico.green.js/red_upload.html)
[ThermoScan](https://diewland.github.io/pico.green.js/thermoscan.html)

## TODO
* remove rect inside rect
* camvas, fps support
* add more examples
