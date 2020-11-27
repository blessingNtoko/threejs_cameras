import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { MinMaxGUIHelper } from './Helpers/helpers.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public scene = new THREE.Scene();
  public renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true
  });
  public camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 5, 50);
  public cameraHelper = new THREE.CameraHelper(this.camera);
  public textureLoader = new THREE.TextureLoader();

  ngOnInit() {
    this.init();
  }

  private init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.scene.add(this.cameraHelper);

    const view1Elem: any = document.querySelector('#view1');
    const view2Elem: any = document.querySelector('#view2');

    const controls = new OrbitControls(this.camera, view1Elem);

    controls.target.set(0, 5, 0);
    controls.update();

    this.camera.zoom = .2;
    this.camera.position.set(0, 10, 20);

    const camera2 = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 500);
    camera2.position.set(40, 10, 30);
    camera2.lookAt(0, 5, 0);

    const controls2 = new OrbitControls(camera2, view2Elem);
    controls2.target.set(0, 5, 0);
    controls2.update();

    const planeSize = 40;

    const texture = this.textureLoader.load('../assets/textures/grass.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    {
      const cubeSize = 4;
      const cubeGeo = new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: '#8ac'
      });
      const mesh = new THREE.Mesh(cubeGeo, cubeMat);
      mesh.position.set(cubeSize + 1, cubeSize / 2, 0);
      this.scene.add(mesh);
    }

    {
      const sphereRadius = 3;
      const sphereWidthDiv = 32;
      const sphereHeightDiv = 16;
      const sphereGeo = new THREE.SphereBufferGeometry(sphereRadius, sphereWidthDiv, sphereHeightDiv);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: '#ca8'
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
      this.scene.add(mesh);
    }

    const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshStandardMaterial({
      map: texture,
      // color: 'blue',
      side: THREE.DoubleSide
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = Math.PI * -.5;
    this.scene.add(planeMesh);

    // const updateCamera = () => {
    //   this.camera.updateProjectionMatrix();
    // }

    const color = 0xFFFFFF
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    this.scene.add(light);
    this.scene.add(light.target);

    const gui = new dat.GUI();
    // gui.add(this.camera, 'fov', 1, 180).onChange(updateCamera);
    gui.add(this.camera, 'zoom', .01, 1, .01).listen();
    const minMaxHelper = new MinMaxGUIHelper(this.camera, 'near', 'far', .1);
    gui.add(minMaxHelper, 'min', .00001, 50, .1).name('near');
    gui.add(minMaxHelper, 'max', .1, 50, .1).name('far');
    // gui.add(minMaxHelper, 'min', .1, 50, .1).name('near').onChange(updateCamera);
    // gui.add(minMaxHelper, 'max', .1, 50, .1).name('far').onChange(updateCamera);

    const animate = () => {

      // turn on scissor
      this.renderer.setScissorTest(true);

      // render original view
      {
        const aspect = this.setScissorForElem(view1Elem);

        // adjust the camera for this aspect
        this.camera.left = -aspect;
        this.camera.right = aspect;
        this.camera.updateProjectionMatrix();
        this.cameraHelper.update();

        // don't draw the camera helper in the original view
        this.cameraHelper.visible = false;

        this.scene.background = new THREE.Color(0x000000);

        // render
        this.renderer.render(this.scene, this.camera);
      }

      // render from the 2nd camera
      {
        const aspect = this.setScissorForElem(view2Elem);

        // adjust camera for this aspect
        camera2.aspect = aspect;
        camera2.updateProjectionMatrix();

        // draw cameraHelper in the 2nd view
        this.cameraHelper.visible = true;

        this.scene.background = new THREE.Color(0x000040);

        this.renderer.render(this.scene, camera2);
      }

      controls.update();
      controls2.update();


      // this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate);
  }

  public setScissorForElem(elem) {
    const canvasRect = this.renderer.domElement.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();

    // Compute a canvas relative rectangle
    const right = Math.min(elemRect.right, canvasRect.right) - canvasRect.left;
    const left = Math.max(0, elemRect.left - canvasRect.left);
    const bottom = Math.min(elemRect.bottom, canvasRect.bottom) - canvasRect.top;
    const top = Math.min(0, elemRect.top - canvasRect.top);

    const width = Math.min(canvasRect.width, right - left);
    const height = Math.min(canvasRect.height, bottom - top);

    // setup the scissor to only render to that part of the canvas
    const positiveYUpBottom = canvasRect.height - bottom;
    this.renderer.setScissor(left, positiveYUpBottom, width, height);
    this.renderer.setViewport(left, positiveYUpBottom, width, height);

    // return the aspect
    return width / height;
  }
}
