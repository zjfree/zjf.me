// ThreeJS编辑器
var ThreeEditor = TE = {

    // 版本
    version: '20200210',

    // 内部变量
    renderer: null,
    camera: null,
    scene: null,
    stats: null,
    orbit: null,
    transformControl: null,
    gui: null,
    datGui: null,
    guiController: null,
    guiEnabled: true,
    raycaster: null,
    tween: null,
    INTERSECTED: null,

    divMain: null,

    isMove: null,
    isMouseDown: false,
    mouseMoveIndex: 0,
    targetPosition: null,

    init: function (el) {
        TE.divMain = $('#' + el);

        TE.initRender();
        TE.initScene();
        TE.initCamera();
        TE.initLight();
        TE.initModel();
        TE.initControls();
        TE.initStats();
        TE.initGui();
        TE.initRaycaster();

        requestAnimationFrame(TE.animate);
        window.onresize = TE.onWindowResize;
    },

    //弧度角度换算
    getRad: function (deg) {
        return (Math.PI * deg) / 180;
    },
    getDeg: function (rad) {
        let deg = (rad * 180) / Math.PI;
        deg = deg % 360;
        if (deg < 0) {
            deg += 360;
        }
        return deg;
    },

    initRender: function () {
        TE.renderer = new THREE.WebGLRenderer({ antialias: true });
        TE.renderer.shadowMap.enabled = true;
        TE.renderer.shadowMap.type = THREE.VSMShadowMap;
        TE.renderer.outputEncoding = THREE.sRGBEncoding;

        TE.renderer.setPixelRatio( window.devicePixelRatio );
        /*
        BasicShadowMap 能够给出没有经过过滤的阴影映射 —— 速度最快，但质量最差。
        PCFShadowMap 为默认值，使用Percentage-Closer Filtering (PCF)算法来过滤阴影映射。
        PCFSoftShadowMap 使用Percentage-Closer Soft Shadows (PCSS)算法来过滤阴影映射。
        VSMShadowMap 使用Variance Shadow Map (VSM)算法来过滤阴影映射。当使用VSMShadowMap时，所有阴影接收者也将会投射阴影。
        */

        TE.renderer.setClearColor('#333'); //设置背景颜色
        TE.renderer.setSize(TE.divMain.width(), TE.divMain.height());
        TE.divMain[0].appendChild(TE.renderer.domElement);
    },

    initCamera: function () {
        TE.camera = new THREE.PerspectiveCamera(30, TE.divMain.width() / TE.divMain.height(), 0.1, 1000);
        TE.camera.position.set(0, 20, 60);
    },

    initScene: function () {
        TE.scene = new THREE.Scene();
        TE.scene.fog = new THREE.FogExp2('#ccc', 0.005);
        //scene.fog = new THREE.Fog('#ccc', 20, 100);

        // SKYBOX/FOG
        // var skyBoxGeometry = new THREE.CubeGeometry(200, 200, 200);
        // var skyBoxMaterial = new THREE.MeshBasicMaterial({ color: '#367EE3', side: THREE.BackSide });
        // var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
        // TP.scene.add(skyBox);
    
        let urls = [
            '/static/threejs/img/skybox_RT_s.jpg', // right
            '/static/threejs/img/skybox_LF_s.jpg', // left
            '/static/threejs/img/skybox_UP_s.jpg', // top
            '/static/threejs/img/skybox_DN_s.jpg', // bottom
            '/static/threejs/img/skybox_BK_s.jpg', // back
            '/static/threejs/img/skybox_FR_s.jpg'  // front
        ];
        let skyboxCubemap = new THREE.CubeTextureLoader().load(urls);
        TE.scene.background = skyboxCubemap;

        // 坐标轴辅助
        let axes = new THREE.AxesHelper(50);
        TE.scene.add(axes);

        // 网格
        let gridHelper = new THREE.GridHelper(100, 100, 0x0000ff, '#111');
        TE.scene.add(gridHelper);
    },

    initLight: function () {
        TE.scene.add(new THREE.AmbientLight(0x404040));

        let light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 50, 50);
        light.castShadow = true;
        //light.shadowCameraVisible = true;
        TE.scene.add(light);

        let helper = new THREE.DirectionalLightHelper(light, 5);
        TE.scene.add(helper);

        light.shadow.camera.near = 0.5;    // default
        light.shadow.camera.far = 500;     // default
        light.shadow.camera.top = 100;     // default
        light.shadow.camera.right = 100;     // default
        light.shadow.camera.bottom = -100;     // default
        light.shadow.camera.left = -100;     // default
        //console.log(light.shadow.camera);

        //addObj(new THREE.DodecahedronGeometry(1, 2), {x:0,y:50,z:50}, 'red');

        // LIGHT
        light = new THREE.PointLight(0xffffff, 0.3);
        light.position.set(0, 50, -50);
        light.castShadow = false;
        //light.shadowCameraVisible = true;
        TE.scene.add(light);

        let pointLightHelper = new THREE.PointLightHelper(light, 1);
        TE.scene.add(pointLightHelper);
    },

    initModel: function () {

        // 一个立方体
        TE.addObj(new THREE.BoxBufferGeometry(50, 0.4, 50), { x: 0, y: 0.2, z: 0 }, '#363', '../static/threejs/texture/texture02.jpg');

        let i = 0;
        for (let x = -20; x <= 20; x += 5) {
            for (let y = -20; y <= 20; y += 5) {
                let h = 3 + Math.random() * 10;
                let geometry = new THREE.BoxBufferGeometry(4, h, 4);
                geometry.translate(0, h / 2, 0);

                TE.addObj(geometry, { x: x, y: 0, z: y }, null, '../static/threejs/texture/texture01.jpg');

                i++;
                let spritey = TE.addMarker(" #" + i + "号 ");
                spritey.position.set(x, h, y);
            }
        }

        TE.addText('Hello World!');

        TE.addSvg('../static/threejs/models/svg/threejs.svg');
    },

    // 初始化Stats
    initStats: function () {
        TE.stats = new Stats();
        TE.stats.dom.style.position = 'absolute';
        TE.stats.dom.style.left = '0px';
        TE.stats.dom.style.top = '0px';
        TE.divMain[0].appendChild(TE.stats.dom);
    },

    // 初始化控制
    initControls: function () {

        TE.orbit = new THREE.OrbitControls(TE.camera, TE.renderer.domElement);

        // 如果使用animate方法时，将此函数删除
        //orbit.addEventListener( 'change', render );
        // 使动画循环使用时阻尼或自转 意思是否有惯性
        TE.orbit.enableDamping = true;
        //动态阻尼系数 就是鼠标拖拽旋转灵敏度
        //orbit.dampingFactor = 0.25;
        //是否可以缩放
        TE.orbit.enableZoom = true;
        //是否自动旋转
        TE.orbit.autoRotate = true;
        TE.orbit.autoRotateSpeed = 0.3;
        //设置相机距离原点的最远距离
        TE.orbit.minDistance = 1;
        //设置相机距离原点的最远距离
        TE.orbit.maxDistance = 150;
        //是否开启右键拖拽
        TE.orbit.enablePan = false;

        TE.orbit.minPolarAngle = 45 * Math.PI / 180;
        TE.orbit.maxPolarAngle = 80 * Math.PI / 180;

        // 变换控制
        TE.transformControl = new THREE.TransformControls(TE.camera, TE.renderer.domElement);
        TE.transformControl.size = 0.5;
        TE.transformControl.addEventListener('change', TE.render);
        TE.transformControl.addEventListener('dragging-changed', function (event) {
            TE.orbit.enabled = !event.value;
        });
        TE.scene.add(TE.transformControl);

        // Hiding transform situation is a little in a mess :()
        TE.transformControl.addEventListener('change', function () {
        });

        TE.transformControl.addEventListener('mouseDown', function () {
            isMove = true;
        });

        TE.transformControl.addEventListener('mouseUp', function () {
            isMove = false;
        });

        TE.transformControl.addEventListener('objectChange', function () {
            if (!TE.INTERSECTED) return;

            TE.guiEnabled = false;
            TE.guiController.positionX.setValue(TE.INTERSECTED.position.x);
            TE.guiController.positionY.setValue(TE.INTERSECTED.position.y);
            TE.guiController.positionZ.setValue(TE.INTERSECTED.position.z);
            TE.guiController.rotationX.setValue(TE.getDeg(TE.INTERSECTED.rotation._x));
            TE.guiController.rotationY.setValue(TE.getDeg(TE.INTERSECTED.rotation._y));
            TE.guiController.rotationZ.setValue(TE.getDeg(TE.INTERSECTED.rotation._z));
            TE.guiController.scaleX.setValue(TE.INTERSECTED.scale.x);
            TE.guiController.scaleY.setValue(TE.INTERSECTED.scale.y);
            TE.guiController.scaleZ.setValue(TE.INTERSECTED.scale.z);
            TE.guiController.scale.setValue(Math.min(TE.INTERSECTED.scale.x, TE.INTERSECTED.scale.y, TE.INTERSECTED.scale.z));
            TE.guiEnabled = true;

            if (TE.INTERSECTED.userData['type'] == 'TubeBox')
            {
                TE.updateTube();
            }
        });

        /*
        // 快捷键
        window.addEventListener('keydown', function (event) {
            switch (event.keyCode) {

                case 81: // Q
                    TE.transformControl.setSpace(TE.transformControl.space === "local" ? "world" : "local");
                    break;

                case 16: // Shift
                    TE.transformControl.setTranslationSnap(100);
                    TE.transformControl.setRotationSnap(THREE.Math.degToRad(15));
                    TE.transformControl.setScaleSnap(0.25);
                    break;

                case 87: // W
                    TE.transformControl.setMode("translate");
                    TE.gui.opModel = 'translate';
                    break;

                case 69: // E
                    TE.transformControl.setMode("rotate");
                    TE.gui.opModel = 'rotate';
                    break;

                case 82: // R
                    TE.transformControl.setMode("scale");
                    TE.gui.opModel = 'scale';
                    break;
                case 88: // X
                    TE.gui.opX = TE.transformControl.showX = !TE.transformControl.showX;
                    break;

                case 89: // Y
                    TE.gui.opY = TE.transformControl.showY = !TE.transformControl.showY;
                    break;

                case 90: // Z
                    TE.gui.opZ = TE.transformControl.showZ = !TE.transformControl.showZ;
                    break;

                case 32: // Spacebar
                    TE.gui.opEnabled = TE.transformControl.enabled = !TE.transformControl.enabled;
                    break;
            }
        });

        window.addEventListener('keyup', function (event) {
            switch (event.keyCode) {

                case 17: // Ctrl
                    TE.transformControl.setTranslationSnap(null);
                    TE.transformControl.setRotationSnap(null);
                    TE.transformControl.setScaleSnap(null);
                    break;
            }
        });
        */
    },

    // 初始化自定义参数
    initGui: function () {
        TE.guiController = {};
        //声明一个保存需求修改的相关数据的对象
        TE.gui = {
            fogColor: '#ccc',
            fogDensity: 0.005,

            autoRotate: true,

            curColor: '#fff',
            castShadow: true,
            receiveShadow: true,

            opEnabled: true,
            opModel: 'translate',  // translate  rotate  scale
            opX: true,
            opY: true,
            opZ: true,

            positionX: 1,
            positionY: 1,
            positionZ: 1,

            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,

            scale: 1,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,

            textureUrl: '',
            textureRepeatX: 3,
            textureRepeatY: 3,

            bumpScale: 0.2,
            shininess: 30,
            opacity: 1,

            // 绑定信息
            bind_name: '',
            bind_visible: '',
            bind_color: '',
            bind_positionX: '',
            bind_positionY: '',
            bind_positionZ: '',
            bind_rotationX: '',
            bind_rotationY: '',
            bind_rotationZ: '',
            bind_scaleX: '',
            bind_scaleY: '',
            bind_scaleZ: '',
            bind_opacity: '',
            bind_value: '',
            bind_can_select: '',

            // 拷贝
            copy: function () {
                if (!TE.INTERSECTED) {
                    return;
                }

                if (TE.INTERSECTED.userData.type == 'TubeBox'){
                    return;
                }

                let obj = null;
                if (TE.INTERSECTED.type != 'Mesh') {
                    obj = TE.INTERSECTED.clone();
                    TE.scene.add(obj);
                    TE.selectObj(obj);
                    return;
                }

                let geometry = TE.INTERSECTED.geometry.clone();
                let material = null;
                if (TE.INTERSECTED.material instanceof Array) {
                    material = [];
                    for (let k in TE.INTERSECTED.material) {
                        material.push(TE.INTERSECTED.material[k].clone());
                    }
                }
                else if (TE.INTERSECTED.material) {
                    material = TE.INTERSECTED.material.clone();
                }
                obj = new THREE.Mesh(geometry, material);
                obj.castShadow = TE.INTERSECTED.castShadow;
                obj.receiveShadow = TE.INTERSECTED.receiveShadow;

                obj.userData = TE.INTERSECTED.userData;

                obj.position.set(TE.INTERSECTED.position.x + 2, TE.INTERSECTED.position.y, TE.INTERSECTED.position.z);
                obj.rotation.set(TE.INTERSECTED.rotation.x, TE.INTERSECTED.rotation.y, TE.INTERSECTED.rotation.z);
                obj.scale.set(TE.INTERSECTED.scale.x, TE.INTERSECTED.scale.y, TE.INTERSECTED.scale.z);

                if (obj.userData.type == 'Tube'){
                    TE.setTubeBox(obj);
                }

                TE.scene.add(obj);

                // 选中
                if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
                    obj.material.emissive.setHex(TE.INTERSECTED.currentHex);
                }
                TE.selectObj(obj);
            },

            // 删除
            del: function () {
                if (!TE.INTERSECTED) {
                    return;
                }

                if (!window.confirm('确认删除？')){
                    return;
                }

                TE.scene.remove(TE.INTERSECTED);
                TE.INTERSECTED = null;
                TE.transformControl.detach(TE.transformControl.object);
            },
        };
        TE.datGui = new dat.GUI();
        //将设置属性添加到gui当中，gui.add(对象，属性，最小值，最大值）
        let f1 = TE.datGui.addFolder('基础');
        TE.guiController.fogColor = f1.addColor(TE.gui, 'fogColor').name('雾气颜色').onChange(function (value) {
            if (!TE.guiEnabled) return;
            TE.scene.fog.color.set(value);
        });
        TE.guiController.fogDensity = f1.add(TE.gui, 'fogDensity', 0, 0.04).name('雾气强度').onChange(function (value) {
            if (!TE.guiEnabled) return;
            TE.scene.fog.density = value;
        });

        // 自动旋转
        TE.guiController.autoRotate = f1.add(TE.gui, 'autoRotate').name('自动旋转').onChange(function (value) {
            if (!TE.guiEnabled) return;
            if (TE.INTERSECTED) return;
            TE.orbit.autoRotate = value;
        });

        //f1.open();

        let f2 = TE.datGui.addFolder('选中项');
        f2.add(TE.gui, 'opEnabled').listen().name('操作启用').onChange(function (value) {
            TE.transformControl.enabled = value;
        });
        let modelType = {
            移动: 'translate',
            旋转: 'rotate',
            缩放: 'scale',
        };
        f2.add(TE.gui, 'opModel', modelType).name('操作模式').onChange(function (value) {
            TE.transformControl.setMode(value);
        });
        f2.add(TE.gui, 'opX').name('X轴启用').onChange(function (value) {
            TE.transformControl.showX = value;
        });
        f2.add(TE.gui, 'opY').name('Y轴启用').onChange(function (value) {
            TE.transformControl.showY = value;
        });
        f2.add(TE.gui, 'opZ').name('Z轴启用').onChange(function (value) {
            TE.transformControl.showY = value;
        });

        // 阴影
        TE.guiController.castShadow = f2.add(TE.gui, 'castShadow').name('产生阴影').onChange(function (value) {
            if (TE.INTERSECTED && TE.guiEnabled) {
                TE.INTERSECTED.castShadow = value;
            }
        });
        TE.guiController.receiveShadow = f2.add(TE.gui, 'receiveShadow').name('接受阴影').onChange(function (value) {
            if (TE.INTERSECTED && TE.guiEnabled) {
                TE.INTERSECTED.receiveShadow = value;
            }
        });

        // 颜色
        TE.guiController.curColor = f2.addColor(TE.gui, 'curColor').name('颜色').onChange(function (value) {
            if (TE.INTERSECTED && TE.guiEnabled && TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
                TE.INTERSECTED.material.color.set(value);
                TE.INTERSECTED.userData['materialParams']['color'] = value;
            }
        });

        // 位置
        let positionFn = function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled) return;
            TE.INTERSECTED.position.set(TE.gui.positionX, TE.gui.positionY, TE.gui.positionZ);
        };
        TE.guiController.positionX = f2.add(TE.gui, 'positionX').name('位置X').onChange(positionFn);
        TE.guiController.positionY = f2.add(TE.gui, 'positionY').name('位置Y').onChange(positionFn);
        TE.guiController.positionZ = f2.add(TE.gui, 'positionZ').name('位置Z').onChange(positionFn);

        // 角度
        let rotationFn = function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled) return;
            TE.INTERSECTED.rotation.set(TE.getRad(TE.gui.rotationX), TE.getRad(TE.gui.rotationY), TE.getRad(TE.gui.rotationZ), 'XYZ');
        };
        TE.guiController.rotationX = f2.add(TE.gui, 'rotationX', 0, 360, 5).name('旋转X').onChange(rotationFn);
        TE.guiController.rotationY = f2.add(TE.gui, 'rotationY', 0, 360, 5).name('旋转Y').onChange(rotationFn);
        TE.guiController.rotationZ = f2.add(TE.gui, 'rotationZ', 0, 360, 5).name('旋转Z').onChange(rotationFn);

        // 缩放
        TE.guiController.scale = f2.add(TE.gui, 'scale', 0).name('缩放').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled) return;
            TE.INTERSECTED.scale.set(value, value, value);

            TE.guiEnabled = false;
            TE.guiController.scaleX.setValue(value);
            TE.guiController.scaleY.setValue(value);
            TE.guiController.scaleZ.setValue(value);
            TE.guiEnabled = true;
        });
        let scaleFn = function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled) return;
            TE.INTERSECTED.scale.set(TE.gui.scaleX, TE.gui.scaleY, TE.gui.scaleZ);
        };
        TE.guiController.scaleX = f2.add(TE.gui, 'scaleX').name('缩放X').onChange(scaleFn);
        TE.guiController.scaleY = f2.add(TE.gui, 'scaleY').name('缩放Y').onChange(scaleFn);
        TE.guiController.scaleZ = f2.add(TE.gui, 'scaleZ').name('缩放Z').onChange(scaleFn);

        // 材质
        let textureType = {
            empty: '',
            texture01: '../static/threejs/texture/texture01.jpg',
            texture02: '../static/threejs/texture/texture02.jpg',
            texture03: '../static/threejs/texture/texture03.jpg',
        };
        TE.guiController.textureUrl = f2.add(TE.gui, 'textureUrl', textureType).name('材质图片').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled) return;
            if (value == '') {
                if (TE.INTERSECTED.material.map) {
                    TE.INTERSECTED.material.map.repeat.set(0, 0);
                }
                TE.INTERSECTED.userData['textureRepeatX'] = 0;
                TE.INTERSECTED.userData['textureRepeatY'] = 0;
            }
            else {
                var texture = new THREE.TextureLoader().load(value);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(TE.gui.textureRepeatX, TE.gui.textureRepeatY);

                TE.INTERSECTED.material.map = texture;
                TE.INTERSECTED.material.bumpMap = texture;
            }
            TE.INTERSECTED.userData['textureUrl'] = value;
        });
        TE.guiController.textureRepeatX = f2.add(TE.gui, 'textureRepeatX').name('材质缩放X').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled) return;
            if (TE.INTERSECTED.material.map) {
                if (TE.gui.textureUrl == '') {
                    TE.INTERSECTED.material.map.repeat.set(0, 0);
                }
                else {
                    TE.INTERSECTED.material.map.repeat.set(TE.gui.textureRepeatX, TE.gui.textureRepeatY);
                }
            }
            TE.INTERSECTED.userData['textureRepeatX'] = value;
        });
        TE.guiController.textureRepeatY = f2.add(TE.gui, 'textureRepeatY').name('材质缩放Y').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled) return;
            if (TE.INTERSECTED.material.map) {
                if (TE.gui.textureUrl == '') {
                    TE.INTERSECTED.material.map.repeat.set(0, 0);
                }
                else {
                    TE.INTERSECTED.material.map.repeat.set(TE.gui.textureRepeatX, TE.gui.textureRepeatY);
                }
            }
            TE.INTERSECTED.userData['textureRepeatY'] = value;
        });

        // 材质凹凸
        TE.guiController.bumpScale = f2.add(TE.gui, 'bumpScale', 0, 1).name('材质凹凸').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled || !TE.INTERSECTED.material) return;
            TE.INTERSECTED.material.bumpScale = value;
            TE.INTERSECTED.userData['materialParams']['bumpScale'] = value;
        });

        // 高亮
        TE.guiController.shininess = f2.add(TE.gui, 'shininess', 0, 100).name('高亮').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled || !TE.INTERSECTED.material) return;
            TE.INTERSECTED.material.shininess = value;
            TE.INTERSECTED.userData['materialParams']['shininess'] = value;
        });

        // 透明
        TE.guiController.opacity = f2.add(TE.gui, 'opacity', 0, 1).name('透明度').onChange(function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled || !TE.INTERSECTED.material) return;
            TE.INTERSECTED.material.opacity = value;
            TE.INTERSECTED.material.transparent = value != 1;
            TE.INTERSECTED.userData['materialParams']['opacity'] = value;
        });

        // 3D对象操作
        f2.add(TE.gui, 'copy').name('复制3D对象');
        f2.add(TE.gui, 'del').name('删除3D对象');

        // 绑定
        let f3 = TE.datGui.addFolder('绑定');
        let saveBind = function (value) {
            if (!TE.INTERSECTED || !TE.guiEnabled) return;
            if (!TE.INTERSECTED.userData['bind']) {
                TE.INTERSECTED.userData['bind'] = {};
            }
            let k = this.property.replace('bind_', '');
            if (value == '') {
                delete (TE.INTERSECTED.userData['bind'][k]);
            }
            else {
                TE.INTERSECTED.userData['bind'][k] = value;
            }
        };

        TE.guiController.bind_name = f3.add(TE.gui, 'bind_name').name('名称').onFinishChange(saveBind);
        TE.guiController.bind_visible = f3.add(TE.gui, 'bind_visible').name('是否可见').onFinishChange(saveBind);
        TE.guiController.bind_color = f3.add(TE.gui, 'bind_color').name('颜色').onFinishChange(saveBind);
        TE.guiController.bind_positionX = f3.add(TE.gui, 'bind_positionX').name('位置X').onFinishChange(saveBind);
        TE.guiController.bind_positionY = f3.add(TE.gui, 'bind_positionY').name('位置Y').onFinishChange(saveBind);
        TE.guiController.bind_positionZ = f3.add(TE.gui, 'bind_positionZ').name('位置Z').onFinishChange(saveBind);
        TE.guiController.bind_rotationX = f3.add(TE.gui, 'bind_rotationX').name('旋转X').onFinishChange(saveBind);
        TE.guiController.bind_rotationY = f3.add(TE.gui, 'bind_rotationY').name('旋转Y').onFinishChange(saveBind);
        TE.guiController.bind_rotationZ = f3.add(TE.gui, 'bind_rotationZ').name('旋转Z').onFinishChange(saveBind);
        TE.guiController.bind_scaleX = f3.add(TE.gui, 'bind_scaleX').name('缩放X').onFinishChange(saveBind);
        TE.guiController.bind_scaleY = f3.add(TE.gui, 'bind_scaleY').name('缩放Y').onFinishChange(saveBind);
        TE.guiController.bind_scaleZ = f3.add(TE.gui, 'bind_scaleZ').name('缩放Z').onFinishChange(saveBind);
        TE.guiController.bind_opacity = f3.add(TE.gui, 'bind_opacity').name('透明度').onFinishChange(saveBind);
        TE.guiController.bind_value = f3.add(TE.gui, 'bind_value').name('显示值').onFinishChange(saveBind);
        TE.guiController.bind_can_select = f3.add(TE.gui, 'bind_can_select').name('允许选中').onFinishChange(saveBind);
    },

    // 初始化鼠标点击
    initRaycaster: function () {
        TE.raycaster = new THREE.Raycaster();
        TE.divMain.on("mousedown", function (event) {
            if (TE.isMove) return;
            TE.isMouseDown = true;
            TE.mouseMoveIndex = 0;
        });
        $(document).on("mousemove", function (event) {
            TE.isMouseDown = TE.mouseMoveIndex++ == 0;
        });
        TE.divMain.on("mouseup", function (event) {
            if (TE.INTERSECTED) {
                TE.targetPosition = TE.INTERSECTED.position.clone();
                if (TE.INTERSECTED.userData['type'] == 'TubeBox')
                {
                    TE.targetPosition.set(
                        TE.targetPosition.x + TE.INTERSECTED.parent.position.x,
                        TE.targetPosition.y + TE.INTERSECTED.parent.position.y,
                        TE.targetPosition.z + TE.INTERSECTED.parent.position.z
                        );
                }
                TE.animateCamera(TE.orbit.target, TE.targetPosition);
            }
            if (!TE.isMouseDown) return;
            TE.isMouseDown = false;
            event.preventDefault();
            let mouse = new THREE.Vector2();
            let objects = [];
            mouse.x = ((event.clientX - 0) / TE.divMain.width()) * 2 - 1;
            mouse.y = - (event.clientY / TE.divMain.height()) * 2 + 1;

            TE.raycaster.setFromCamera(mouse, TE.camera);
            TE.scene.children.forEach(child => {
                if (!child.type) return;
                if (!child.userData.type) return;

                if ($.inArray(child.type, ['Mesh', 'Scene', 'Sprite', 'Group']) != -1) {
                    objects.push(child)
                };
            });

            //var intersects = raycaster.intersectObjects(objects, true);
            var intersects = TE.raycaster.intersectObjects(objects, true);
            console.log(intersects);
            if (intersects.length > 0) {
                let curObj = intersects[0].object;
                while (true) {
                    if (curObj.userData.type) {
                        break;
                    }
                    if (!curObj.parent) {
                        break;
                    }
                    if (!curObj.parent.parent) {
                        break;
                    }
                    curObj = curObj.parent;
                }

                TE.selectObj(curObj);
                TE.orbit.autoRotate = false;
            }
            else {
                if (TE.INTERSECTED) {
                    if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
                        TE.INTERSECTED.material.emissive.setHex(TE.INTERSECTED.currentHex);
                    }
                }

                TE.orbit.autoRotate = TE.gui.autoRotate;
                TE.INTERSECTED = null;
                TE.transformControl.detach(TE.transformControl.object);
            }
            //console.log(targetPosition);
        });
    },

    // 选中3D对象
    selectObj: function (obj) {
        if (obj == TE.INTERSECTED) {
            return;
        }
        if (TE.INTERSECTED) {
            if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
                TE.INTERSECTED.material.emissive.setHex(TE.INTERSECTED.currentHex);
            }
        }

        // 高亮
        TE.INTERSECTED = obj;

        TE.guiEnabled = false;
        if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
            console.log(TE.INTERSECTED.material);
            TE.guiController.curColor.setValue('#' + TE.INTERSECTED.material.color.getHexString());
        }
        TE.guiController.positionX.setValue(TE.INTERSECTED.position.x);
        TE.guiController.positionY.setValue(TE.INTERSECTED.position.y);
        TE.guiController.positionZ.setValue(TE.INTERSECTED.position.z);
        TE.guiController.rotationX.setValue(TE.INTERSECTED.rotation._x * 180 / Math.PI);
        TE.guiController.rotationY.setValue(TE.INTERSECTED.rotation._y * 180 / Math.PI);
        TE.guiController.rotationZ.setValue(TE.INTERSECTED.rotation._z * 180 / Math.PI);
        TE.guiController.scaleX.setValue(TE.INTERSECTED.scale.x);
        TE.guiController.scaleY.setValue(TE.INTERSECTED.scale.y);
        TE.guiController.scaleZ.setValue(TE.INTERSECTED.scale.z);
        TE.guiController.scale.setValue(Math.min(TE.INTERSECTED.scale.x, TE.INTERSECTED.scale.y, TE.INTERSECTED.scale.z));

        TE.guiController.castShadow.setValue(TE.INTERSECTED.castShadow);
        TE.guiController.receiveShadow.setValue(TE.INTERSECTED.receiveShadow);

        TE.guiController.textureUrl.setValue(TE.INTERSECTED.userData['textureUrl']);
        TE.guiController.textureRepeatX.setValue(TE.INTERSECTED.userData['textureRepeatX']);
        TE.guiController.textureRepeatY.setValue(TE.INTERSECTED.userData['textureRepeatY']);

        //console.log(INTERSECTED);
        if (TE.INTERSECTED.material && (TE.INTERSECTED.material instanceof THREE.MeshPhongMaterial)) {
            TE.INTERSECTED.currentHex = TE.INTERSECTED.material.emissive.getHex();
            TE.INTERSECTED.material.emissive.setHex(0x333333);
            TE.guiController.bumpScale.setValue(TE.INTERSECTED.material.bumpScale);
            TE.guiController.shininess.setValue(TE.INTERSECTED.material.shininess);
        }
        if (TE.INTERSECTED.material) {
            TE.guiController.opacity.setValue(TE.INTERSECTED.material.opacity);
        }

        // 绑定
        let bindData = TE.INTERSECTED.userData['bind'] || {};
        // console.log(bindData);
        for (let k in TE.guiController) {
            if (k.indexOf('bind_') !== 0) {
                continue;
            }

            let kk = k.replace('bind_', '');
            TE.guiController[k].setValue(bindData[kk] || '');
        }

        TE.guiEnabled = true;

        TE.transformControl.attach(TE.INTERSECTED);
        TE.targetPosition = TE.INTERSECTED.position.clone();
        if (TE.INTERSECTED.userData['type'] == 'TubeBox')
        {
            TE.targetPosition.set(
                TE.targetPosition.x + TE.INTERSECTED.parent.position.x,
                TE.targetPosition.y + TE.INTERSECTED.parent.position.y,
                TE.targetPosition.z + TE.INTERSECTED.parent.position.z
                );
        }
        TE.animateCamera(TE.orbit.target, TE.targetPosition);
    },

    // 渲染、动画
    render: function () {
        TE.renderer.render(TE.scene, TE.camera);
    },

    onWindowResize: function () {
        TE.camera.aspect = TE.divMain.width() / TE.divMain.height();
        TE.camera.updateProjectionMatrix();
        TE.render();
        TE.renderer.setSize(TE.divMain.width(), TE.divMain.height());
    },

    animate: function (time) {
        //更新控制器
        TE.orbit.update();
        TWEEN.update(time);
        TE.render();

        //更新性能插件
        TE.stats.update();
        requestAnimationFrame(TE.animate);
    },

    // 3D物体
    addObj: function (geometry, position, color, textureUrl) {
        color = color || '#' + Math.random().toString(16).substr(2, 6).toUpperCase();
        textureUrl = textureUrl || '';

        //let material = new THREE.MeshPhysicalMaterial( { color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide } );
        //let material = new THREE.MeshBasicMaterial( { color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide } );
        //let material = new THREE.MeshLambertMaterial( { color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide } );
        let material = new THREE.MeshPhongMaterial({ color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide });
        //let material = new THREE.MeshStandardMaterial( { color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide } );

        // 纹理
        let texture = null;
        if (textureUrl) {
            texture = new THREE.TextureLoader().load(textureUrl);
            texture.repeat.set(3, 3);
        }
        else {
            texture = new THREE.TextureLoader().load('../static/threejs/texture/texture01.jpg');
            texture.repeat.set(0, 0);
        }

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        material.map = texture;
        material.bumpMap = texture;
        material.bumpScale = 0.2;

        let obj = new THREE.Mesh(geometry, material);
        obj.castShadow = true;
        obj.receiveShadow = true;

        obj.userData['type'] = geometry.type.replace('Buffer', '').replace('Geometry', '');
        obj.userData['geometryParams'] = geometry.parameters;
        obj.userData['materialParams'] = {
            color: color,
            bumpScale: 0.2,
            shininess: 30,
            opacity: 1,
        };
        obj.userData['textureUrl'] = textureUrl;
        obj.userData['textureRepeatX'] = 3;
        obj.userData['textureRepeatY'] = 3;
        obj.userData['bind'] = {};

        TE.scene.add(obj);
        obj.position.set(position.x, position.y, position.z);

        /*
        // 添加外框
        var outlineMaterial1 = new THREE.MeshBasicMaterial( { color: 0x0000ff, side: THREE.BackSide } );
        var outlineMesh1 = new THREE.Mesh( geometry, outlineMaterial1 );
        // outlineMesh1.position = position;
        outlineMesh1.scale.multiplyScalar(1.03);
        scene.add( outlineMesh1 );
        objList.push(outlineMesh1);
        outlineMesh1.position.set(position.x,position.y,position.z);
        */

        return obj;
    },

    // 添加3D文字
    addText: function (txt, size, height, color, fnCallback) {
        size = size || 3;
        height = height || 1;
        color = color || '#FF0000';
        let loader = new THREE.FontLoader();
        loader.load('../static/threejs/font/helvetiker_regular.typeface.json', function (font) {
            let textOption = {
                size: size, height: height, curveSegments: 10,
                font: font, weight: "normal", style: "normal",
                bevelThickness: 0.1, bevelSize: 0.1, bevelEnabled: false,
                material: 0, extrudeMaterial: 1
            };
            let textGeom = new THREE.TextBufferGeometry(txt, textOption);
            // font: helvetiker, gentilis, droid sans, droid serif, optimer
            // weight: normal, bold

            let material = new THREE.MeshPhongMaterial({ color: color, side: THREE.DoubleSide, shadowSide: THREE.BackSide, flatShading: true });

            let texture = new THREE.TextureLoader().load('../static/threejs/texture/texture01.jpg');
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(0, 0);

            material.map = texture;
            material.bumpMap = texture;
            material.bumpScale = 0.2;

            let textMesh = new THREE.Mesh(textGeom, material);
            textMesh.castShadow = true;
            textMesh.receiveShadow = true;

            textGeom.computeBoundingBox();
            let textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;

            textMesh.position.set(-0.5 * textWidth, 20, 0);
            //textMesh.rotation.x = -Math.PI / 4;

            delete (textOption.font);
            textMesh.userData['type'] = textGeom.type.replace('Buffer', '').replace('Geometry', '');
            textMesh.userData['geometryParams'] = textOption;
            textMesh.userData['materialParams'] = {
                color: color,
                bumpScale: 0.2,
                shininess: 30,
                opacity: 1,
            };
            textMesh.userData['text'] = txt;
            textMesh.userData['textureUrl'] = '';
            textMesh.userData['textureRepeatX'] = 3;
            textMesh.userData['textureRepeatY'] = 3;
            textMesh.userData['bind'] = {};

            TE.scene.add(textMesh);
            if (fnCallback) {
                fnCallback(textMesh);
            }
        });
    },

    // 添加SVG
    addSvg: function (svgUrl, fnCallback) {
        let loader = new THREE.SVGLoader();
        loader.load(svgUrl, function (data) {

            let paths = data.paths;

            let group = new THREE.Group();
            //group.scale.multiplyScalar(0.05);
            group.position.x = 0;
            group.position.y = 30;
            group.scale.y *= - 1;

            for (let i = 0; i < paths.length; i++) {

                let path = paths[i];

                let fillColor = path.userData.style.fill;
                if (fillColor !== undefined && fillColor !== 'none') {

                    let material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color().setStyle(fillColor),
                        opacity: path.userData.style.fillOpacity,
                        transparent: path.userData.style.fillOpacity < 1,
                        side: THREE.DoubleSide,
                        depthWrite: false,
                        wireframe: false,
                    });

                    let shapes = path.toShapes(true);

                    for (let j = 0; j < shapes.length; j++) {

                        let shape = shapes[j];
                        let geometry = new THREE.ShapeBufferGeometry(shape);
                        let mesh = new THREE.Mesh(geometry, material);
                        mesh.castShadow = true;
                        //mesh.receiveShadow = true;

                        mesh.scale.multiplyScalar(0.03);
                        group.add(mesh);
                    }
                }

                let strokeColor = path.userData.style.stroke;
                if (strokeColor !== undefined && strokeColor !== 'none') {

                    let material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color().setStyle(strokeColor),
                        opacity: path.userData.style.strokeOpacity,
                        transparent: path.userData.style.strokeOpacity < 1,
                        side: THREE.DoubleSide,
                        depthWrite: false,
                        wireframe: false,
                    });

                    for (let j = 0, jl = path.subPaths.length; j < jl; j++) {
                        let subPath = path.subPaths[j];
                        let geometry = THREE.SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style);
                        if (geometry) {
                            let mesh = new THREE.Mesh(geometry, material);
                            mesh.castShadow = true;
                            mesh.scale.multiplyScalar(0.03);
                            group.add(mesh);
                        }
                    }
                }
            }

            group.userData['type'] = 'Svg';
            group.userData['svgUrl'] = svgUrl;
            group.userData['bind'] = {};

            TE.scene.add(group);
            if (fnCallback) {
                fnCallback(group);
            }
        });
    },

    // 添加图片
    addImg: function (imgUrl) {
        let spriteMap = new THREE.TextureLoader().load(imgUrl);

        let spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap, color: 0xffffff });

        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1, 1, 1)

        sprite.userData['type'] = 'Img';
        sprite.userData['imgUrl'] = imgUrl;
        sprite.userData['materialParams'] = {
            opacity: 1,
        };
        sprite.userData['bind'] = {};

        TE.scene.add(sprite);

        return sprite;
    },

    addModel: function (model_name, fnCallback) {
        // 加载 glTF 格式的模型
        let loader = new THREE.GLTFLoader();/*实例化加载器*/
        loader.setPath('../static/threejs/models/');
        /*
        var dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath( '../static/threejs/js/libs/draco/' );
        loader.setDRACOLoader( dracoLoader );
        */

        loader.load(model_name, function (obj) {
            //console.log(obj);
            let modelObj = obj.scene;
            modelObj.userData['type'] = 'Model';
            modelObj.userData['modelName'] = model_name;
            modelObj.userData['bind'] = {};
            TE.scene.add(modelObj);
            modelObj.scale.x = 50;
            modelObj.scale.y = 50;
            modelObj.scale.z = 50;
            modelObj.traverse(function (object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
					object.material.metalness = 0.5;
                    //console.log(object);
                }
            });

            if (fnCallback) {
                fnCallback(modelObj);
            }

        }, function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        }, function (error) {
            console.log('load error!', error);
        });

    },

    // 文字标签
    addMarker: function (txt, parameters) {
        if (parameters === undefined) parameters = {};

        let fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";

        let fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 48;

        let borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 4;

        let borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : 'rgba(0,0,0,0.7)';

        let backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters["backgroundColor"] : 'rgba(255,255,255,0.7)';

        let color = parameters.hasOwnProperty("color") ?
            parameters["color"] : '#000';

        //var spriteAlignment = THREE.SpriteAlignment.topLeft;
        let spriteAlignment = null;

        let canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 50;
        let context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        let metrics = context.measureText(txt);
        let textWidth = metrics.width;

        // 重新设置宽度
        canvas = document.createElement('canvas');
        canvas.width = textWidth + borderThickness + 6;
        canvas.height = fontsize * 1.4 + borderThickness + 6;
        context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;

        // background color
        context.fillStyle = backgroundColor;
        // border color
        context.strokeStyle = borderColor;

        context.lineWidth = borderThickness;
        TE.roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // 1.4 is extra height factor for text below baseline: g,j,p,q.

        // text color
        context.fillStyle = color;

        context.fillText(txt, borderThickness, fontsize + borderThickness);
        // $('body').append(canvas);

        // canvas contents will be used for a texture
        let texture = new THREE.CanvasTexture(canvas);

        let spriteMaterial = new THREE.SpriteMaterial(
            { map: texture, transparent:true });
        let sprite = new THREE.Sprite(spriteMaterial);
        let zoom = fontsize / 48;
        sprite.scale.set(zoom * canvas.width / canvas.height, zoom, zoom);
        sprite.center.set(0.5, 0);

        sprite.userData['type'] = 'Marker';
        sprite.userData['markerParams'] = parameters;
        sprite.userData['markerParams']['text'] = txt;
        sprite.userData['materialParams'] = {
            opacity: 1,
        };
        sprite.userData['bind'] = {};

        TE.scene.add(sprite);

        return sprite;
    },

    // function for drawing rounded rectangles
    roundRect: function (ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },

    // 添加管道
    addTube:function(radius, radialSegments, color){
        let curve = new THREE.CatmullRomCurve3( [
            new THREE.Vector3( -10, 0, 0 ),
            new THREE.Vector3( 10, 0, 0 ),
        ], false, 'catmullrom', 0.0001 );

        // 可能的值为centripetal、chordal和catmullrom。
        // 当.type为catmullrom时，定义catmullrom的张力。
        curve.arcLengthDivisions = 1;

        let geometry = new THREE.TubeBufferGeometry( curve, curve.points.length * 10, radius||0.5, radialSegments||32 );
        let mesh = TE.addObj(geometry, {x:0,y:20,z:0}, color);
        mesh.userData['geometryParams'] = {
            closed: mesh.geometry.parameters.closed,
            path: mesh.geometry.parameters.path.points,
            radialSegments: mesh.geometry.parameters.radialSegments,
            radius: mesh.geometry.parameters.radius,
            tubularSegments: mesh.geometry.parameters.tubularSegments,
        };

        TE.setTubeBox(mesh);

        return mesh;
    },

    // 添加管道控制点
    setTubeBox:function(tube){
        let radius = tube.userData.geometryParams.radius * 1.2;

        tube.children = [];
        let points = tube.userData.geometryParams.path;

        for (let i=0; i<points.length; i++)
        {
            let material1 = new THREE.MeshBasicMaterial( { color: '#00FF00' } );
            material1.transparent = true;
            material1.opacity = 0.8;
            let geometry = new THREE.DodecahedronBufferGeometry(radius, 2);
            let obj = new THREE.Mesh(geometry, material1);
            obj.userData['type'] = 'TubeBox';
            obj.userData['index'] = i;
            obj.userData['point_type'] = 'solid';

            tube.add(obj);

            obj.position.set(points[i].x, points[i].y, points[i].z);
        }
        
        for (let i=1; i<points.length; i++)
        {
            let material2 = new THREE.MeshBasicMaterial( { color: '#0000FF' } );
            material2.transparent = true;
            material2.opacity = 0.5;
    
            let geometry = new THREE.DodecahedronBufferGeometry(radius, 2);
            let obj = new THREE.Mesh(geometry, material2);
            obj.userData['type'] = 'TubeBox';
            obj.userData['index'] = i - 0.5;
            obj.userData['point_type'] = 'dotted';

            tube.add(obj);

            let x = (points[i].x + points[i-1].x) / 2;
            let y = (points[i].y + points[i-1].y) / 2;
            let z = (points[i].z + points[i-1].z) / 2;

            obj.position.set(x,y,z);
        }
    },

    getTubeBox:function(tube, index){
        let curBox = null;
        
        for (let k in tube.children)
        {
            let box = tube.children[k];
            if (box.userData['index'] == index)
            {
                curBox = box;
                break;
            }
        }

        return curBox;
    },

    // 更新
    updateTube:function(){
        if (TE.INTERSECTED.userData['type'] != 'TubeBox') return;
        
        let x = 0;
        let y = 0;
        let z = 0;

        let cur = TE.INTERSECTED;
        let tube = cur.parent;
        
        let radius = tube.userData['geometryParams'].radius * 1.2;
        let count = tube.userData['geometryParams']['path'].length;

        if (cur.userData['point_type'] == 'dotted')
        {
            // 新加一个控制点
            cur.userData['point_type'] = 'solid';
            cur.material.opacity = 0.8;
            cur.material.color.set('#00FF00');

            // 大于的全加1
            for (let k in tube.children)
            {
                let box = tube.children[k];
                if (box.userData['index'] > cur.userData['index'])
                {
                    box.userData['index'] += 1;
                }
            }

            cur.userData['index'] = Math.floor(cur.userData['index']) + 1;
            count += 1;

            // 添加两个虚的控制点
            let box1 = TE.getTubeBox(tube, cur.userData['index'] - 1);
            let box2 = TE.getTubeBox(tube, cur.userData['index'] + 1);

            // 前面的控制点
            let material1 = new THREE.MeshBasicMaterial( { color: '#0000FF' } );
            material1.transparent = true;
            material1.opacity = 0.5;

            let geometry1 = new THREE.DodecahedronBufferGeometry(radius, 2);
            let obj1 = new THREE.Mesh(geometry1, material1);
            obj1.userData['type'] = 'TubeBox';
            obj1.userData['index'] = cur.userData['index'] - 0.5;
            obj1.userData['point_type'] = 'dotted';

            tube.add(obj1);

            x = (cur.position.x + box1.position.x) / 2;
            y = (cur.position.y + box1.position.y) / 2;
            z = (cur.position.z + box1.position.z) / 2;

            obj1.position.set(x,y,z);
            
            // 后面的控制点
            let material2 = new THREE.MeshBasicMaterial( { color: '#0000FF' } );
            material2.transparent = true;
            material2.opacity = 0.5;

            let geometry2 = new THREE.DodecahedronBufferGeometry(radius, 2);
            let obj2 = new THREE.Mesh(geometry2, material2);
            obj2.userData['type'] = 'TubeBox';
            obj2.userData['index'] = cur.userData['index'] + 0.5;
            obj2.userData['point_type'] = 'dotted';

            tube.add(obj2);

            x = (cur.position.x + box2.position.x) / 2;
            y = (cur.position.y + box2.position.y) / 2;
            z = (cur.position.z + box2.position.z) / 2;

            obj2.position.set(x,y,z);
        }

        let points = [];
        for (let i=0; i<count; i++)
        {
            let box = TE.getTubeBox(tube, i);
            if (box)
            {
                let p = box.position;
                points.push(new THREE.Vector3( p.x, p.y, p.z ));
            }
        }

        if (cur.userData['index'] > 0)
        {
            let box = TE.getTubeBox(tube, cur.userData['index'] - 0.5);
            let box1 = TE.getTubeBox(tube, cur.userData['index'] - 1);

            x = (cur.position.x + box1.position.x) / 2;
            y = (cur.position.y + box1.position.y) / 2;
            z = (cur.position.z + box1.position.z) / 2;

            box.position.set(x,y,z);
        }
        if (cur.userData['index'] < count - 1)
        {
            let box = TE.getTubeBox(tube, cur.userData['index'] + 0.5);
            let box1 = TE.getTubeBox(tube, cur.userData['index'] + 1);

            x = (cur.position.x + box1.position.x) / 2;
            y = (cur.position.y + box1.position.y) / 2;
            z = (cur.position.z + box1.position.z) / 2;

            box.position.set(x,y,z);
        }

        let curve = new THREE.CatmullRomCurve3( points, false, 'catmullrom', 0.0001 );
        curve.arcLengthDivisions = 1;

        let geoParam = tube.userData['geometryParams'];

        tube.geometry = new THREE.TubeBufferGeometry( curve, curve.points.length * 10, geoParam['radius'], geoParam['radialSegments'] );
        tube.userData['geometryParams']['path'] = points;
    },

    // 相机动画
    animateCamera: function (current1, current2) {

        let positionVar = {
            x1: current1.x,
            y1: current1.y,
            z1: current1.z
        };
        //关闭控制器
        //orbit.enabled = false;
        TE.tween = new TWEEN.Tween(positionVar);
        TE.tween.to({
            x1: current2.x,
            y1: current2.y,
            z1: current2.z
        }, 500);
        //console.log("Tween", tween);

        TE.tween.onUpdate(function () {

            TE.orbit.target.set(positionVar.x1, positionVar.y1, positionVar.z1);
            TE.orbit.update();

            //console.log("Tween", positionVar);
        })

        TE.tween.onComplete(function () {
            ///开启控制器
            //orbit.enabled = true;
        })

        //tween.easing(TWEEN.Easing.Quadratic.Out);
        TE.tween.start();
    },

    // 添加3D
    add: function (type) {
        let geometry = null;
        let arr = [];
        let tt = TE.orbit.target;
        switch (type) {
            case 'BoxGeometry':
                arr = TE.parseNum(window.prompt('立方体 (X,Y,Z)', '1,1,1'));
                if (arr === null) return;
                geometry = new THREE.BoxBufferGeometry(arr[0], arr[1], arr[2]);
                geometry.translate(0, arr[1] / 2, 0);
                break;
            case 'ConeGeometry':
                arr = TE.parseNum(window.prompt('圆锥形 (半径，高度，分隔)', '1,1,32'));
                if (arr === null) return;
                geometry = new THREE.ConeBufferGeometry(arr[0], arr[1], arr[2]);
                geometry.translate(0, arr[1] / 2, 0);
                break;
            case 'CylinderGeometry':
                arr = TE.parseNum(window.prompt('圆柱体 (顶半径，底半径，高度，分隔)', '1,1,3,32'));
                if (arr === null) return;
                geometry = new THREE.CylinderBufferGeometry(arr[0], arr[1], arr[2], arr[3]);
                geometry.translate(0, arr[2] / 2, 0);
                break;
            case 'DodecahedronGeometry':
                arr = TE.parseNum(window.prompt('12面体 (半径，顶数)', '1,2'));
                if (arr === null) return;
                geometry = new THREE.DodecahedronBufferGeometry(arr[0], arr[1]);
                break;
            case 'IcosahedronGeometry':
                arr = TE.parseNum(window.prompt('20面体 (半径，顶数)', '1,0'));
                if (arr === null) return;
                geometry = new THREE.IcosahedronBufferGeometry(arr[0], arr[1]);
                break;
            case 'OctahedronGeometry':
                arr = TE.parseNum(window.prompt('八面几何体 (半径，顶数)', '1,0'));
                if (arr === null) return;
                geometry = new THREE.OctahedronBufferGeometry(arr[0], arr[1]);
                break;
            case 'RingGeometry':
                arr = TE.parseNum(window.prompt('圆环平面体 (内部半径，外部半径，圆环的分段数)', '1,2,32'));
                if (arr === null) return;
                geometry = new THREE.RingBufferGeometry(arr[0], arr[1], arr[2]);
                break;
            case 'SphereGeometry':
                arr = TE.parseNum(window.prompt('球几何体 (半径，水平分隔，竖直分隔)', '2,16,16'));
                if (arr === null) return;
                geometry = new THREE.SphereBufferGeometry(arr[0], arr[1], arr[2]);
                break;
            case 'TetrahedronGeometry':
                arr = TE.parseNum(window.prompt('四面体 (半径，顶点数)', '2,0'));
                if (arr === null) return;
                geometry = new THREE.TetrahedronBufferGeometry(arr[0], arr[1]);
                break;
            case 'TorusGeometry':
                arr = TE.parseNum(window.prompt('圆环几何体 (圆环的半径，管道半径，圆环的分段数，管道的分段数，圆环的中心角)', '5,1,32,32,360'));
                if (arr === null) return;
                arr[4] = arr[4] * Math.PI / 180;
                geometry = new THREE.TorusBufferGeometry(arr[0], arr[1], arr[2], arr[3], arr[4]);
                break;
            case 'Text':
                let s1 = window.prompt('文本 (大小，厚度，颜色|文本)', '3,1,#ff0000|Hello');
                if (s1 === null || s1.length < 2) return;
                s1 = s1.split('|');
                arr = TE.parseNum(s1[0]);
                TE.addText(s1[1], arr[0], arr[1], arr[2], function (txtObj) {
                    txtObj.position.set(tt.x, tt.y, tt.z);
                    TE.selectObj(txtObj);
                });
                return;
            case 'Marker':
                let s2 = window.prompt('标签 (大小，颜色|文本)', '36,#ff0000|Hello');
                if (s2 === null || s2.length < 2) return;
                s2 = s2.split('|');
                arr = TE.parseNum(s2[0]);
                let markerOption = {
                    fontsize: arr[0],
                    color: arr[1],
                };
                let spritey = TE.addMarker(' ' + s2[1] + ' ', markerOption);
                spritey.position.set(tt.x, tt.y, tt.z);
                TE.selectObj(spritey);
                return;
            case 'Svg':
                let svgUrl = window.prompt('SVG图片 (图片URL)', '../static/threejs/models/svg/threejs.svg');
                if (!svgUrl) return;
                TE.addSvg(svgUrl, function (svgObj) {
                    TE.selectObj(svgObj);
                });
                break;
            case 'Img':
                let imgUrl = window.prompt('IMG图片 (图片URL)', '../static/threejs/models/png/test.png');
                if (!imgUrl) return;
                let imgObj = TE.addImg(imgUrl);
                imgObj.position.set(tt.x, tt.y, tt.z);
                TE.selectObj(imgObj);
                break;
            case 'Model':
                let modelName = window.prompt('GLB模型 (GLB名称)', 'tree03.glb');
                if (!modelName) return;
                TE.addModel(modelName, function (modelObj) {
                    TE.selectObj(modelObj);
                    modelObj.position.set(tt.x, tt.y, tt.z);
                });
                break;
            case 'Tube':
                arr = TE.parseNum(window.prompt('管道 (半径,圆分段数,颜色)', '0.25,32,#FF0000'));
                if (arr === null) return;
                let tubeObj = TE.addTube(arr[0], arr[1], arr[2]);
                TE.selectObj(tubeObj);
                break;
        }

        if (geometry) {
            let obj = TE.addObj(geometry, TE.orbit.target, '#F00');
            TE.selectObj(obj);
        }
    },

    // 转换数字
    parseNum: function (str) {
        if (str === null) return null;
        let arr = str.split(',');
        let aa = [];
        for (let k in arr) {
            if (arr[k].indexOf('#') === 0) {
                aa.push(arr[k]);
            }
            else {
                aa.push(parseFloat(arr[k]));
            }
        }

        return aa;
    },

    save: function () {
        let saveData = {};
        saveData['time'] = (new Date()).toLocaleString();
        saveData['version'] = TE.version;

        saveData['base'] = {
            autoRotate:TE.gui.autoRotate,
        };

        // 雾气
        saveData['base']['fog'] = {
            fogColor: TE.gui.fogColor,
            fogDensity: TE.gui.fogDensity,
        };

        // 元素列表
        let list = [];
        for (let k in TE.scene.children) {
            let obj = TE.scene.children[k];
            if (obj.userData['type']) {
                list.push({
                    type: obj.userData.type,
                    castShadow: obj.castShadow,
                    receiveShadow: obj.receiveShadow,
                    position: obj.position,
                    rotation: obj.rotation.toVector3(),
                    scale: obj.scale,
                    userData: obj.userData,
                });
            }
        }
        saveData['list'] = list;

        console.log(saveData);
        localStorage.setItem('saveData', JSON.stringify(saveData));

        window.alert('保存成功');
    },

    load: function (saveData) {
        if (!saveData)
        {
            let json = localStorage.getItem("saveData");
            if (!json) return;
    
            saveData = JSON.parse(json);
        }
        
        console.log(saveData);

        TE.clear();

        TE.guiEnabled = false;

        // 雾气
        let fog = saveData['base']['fog'];
        TE.scene.fog.color.set(fog.fogColor);
        TE.scene.fog.density = fog.fogDensity;
        TE.guiController.fogColor.setValue(fog.fogColor);
        TE.guiController.fogDensity.setValue(fog.fogDensity);
        
        // 自动旋转
        TE.guiController.autoRotate.setValue(saveData['base']['autoRotate']);
        TE.orbit.autoRotate = saveData['base']['autoRotate'];
        
        // 加载元素
        for (let k in saveData['list']) {
            let obj = saveData['list'][k];
            let mesh = null;
            let geometry = null;
            let geoParam = obj.userData.geometryParams;
            switch (obj.type) {
                case 'Box':
                    geometry = new THREE.BoxBufferGeometry(geoParam.width, geoParam.height, geoParam.depth);
                    geometry.translate(0, geoParam.height / 2, 0);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Marker':
                    mesh = TE.addMarker(obj.userData.markerParams.text, obj.userData.markerParams);
                    break;
                case 'Svg':
                    TE.addSvg(obj.userData.svgUrl, function (svgObj) {
                        TE.setMesh(svgObj, obj);
                    });
                    continue;
                case 'Img':
                    mesh = TE.addImg(obj.userData.imgUrl);
                    break;
                case 'Model':
                    TE.addModel(obj.userData.modelName, function (modelObj) {
                        TE.setMesh(modelObj, obj);
                    });
                    continue;
                case 'Text':
                    TE.addText(obj.userData.text||'', geoParam.size, geoParam.height, obj.userData.materialParams.color, function (txtObj) {
                        TE.setMesh(txtObj, obj);
                    });
                    continue;
                case 'Cone':
                    geometry = new THREE.ConeBufferGeometry(geoParam.radius, geoParam.height, geoParam.radialSegments);
                    geometry.translate(0, geoParam.height / 2, 0);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Cylinder':
                    geometry = new THREE.CylinderBufferGeometry(geoParam.radiusTop, geoParam.radiusBottom, geoParam.height, geoParam.radialSegments);
                    geometry.translate(0, geoParam.height / 2, 0);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Dodecahedron':
                    geometry = new THREE.DodecahedronBufferGeometry(geoParam.radius, geoParam.detail);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Icosahedron':
                    geometry = new THREE.IcosahedronBufferGeometry(geoParam.radius, geoParam.detail);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Octahedron':
                    geometry = new THREE.OctahedronBufferGeometry(geoParam.radius, geoParam.detail);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Ring':
                    geometry = new THREE.RingBufferGeometry(geoParam.innerRadius, geoParam.outerRadius, geoParam.thetaSegments);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Sphere':
                    geometry = new THREE.SphereBufferGeometry(geoParam.radius, geoParam.widthSegments, geoParam.heightSegments);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Tetrahedron':
                    geometry = new THREE.TetrahedronBufferGeometry(geoParam.radius, geoParam.detail);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Torus':
                    geometry = new THREE.TorusBufferGeometry(geoParam.radius, geoParam.tube, geoParam.radialSegments, geoParam.tubularSegments, geoParam.arc);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    break;
                case 'Tube':
                    let pointList = [];
                    for (let k in geoParam.path)
                    {
                        let p = geoParam.path[k];
                        pointList.push(new THREE.Vector3( p.x, p.y, p.z ))
                    }
                    let curve = new THREE.CatmullRomCurve3( pointList, false, 'catmullrom', 0.0001 );
                    curve.arcLengthDivisions = 1;
                    geometry = new THREE.TubeBufferGeometry(curve, curve.points.length * 10, geoParam.radius, geoParam.radialSegments, geoParam.closed);
                    mesh = TE.addObj(geometry, obj.position, obj.userData.materialParams.color, obj.userData.textureUrl);
                    TE.setMesh(mesh, obj);
                    TE.setTubeBox(mesh);
                    continue;
            }

            TE.setMesh(mesh, obj);
        }

        TE.guiEnabled = true;
    },

    setMesh: function (mesh, obj) {
        if (!mesh) return;

        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
        mesh.userData = obj.userData;
    
        mesh.castShadow = obj.castShadow;
        mesh.receiveShadow = obj.receiveShadow;

        if (mesh.type != 'Group' && mesh.material && obj.userData.materialParams) {
            mesh.material.color.set(obj.userData.materialParams.color);
            mesh.material.bumpScale = obj.userData.materialParams.bumpScale;
            mesh.material.shininess = obj.userData.materialParams.shininess;
            mesh.material.opacity = obj.userData.materialParams.opacity;
            if (obj.type != 'Marker' && obj.type != 'Img')
            {
                mesh.material.transparent = mesh.material.opacity < 1;
            }
            else
            {
                mesh.material.transparent = true;
            }

            if ('textureUrl' in obj.userData) {
                if (obj.userData.textureUrl == '') {
                    mesh.material.map.repeat.set(0, 0);
                }
                else {
                    mesh.material.map.repeat.set(obj.userData.textureRepeatX, obj.userData.textureRepeatY);
                }
            }
        }
    },

    clear: function () {

        for (let i = 0; i < TE.scene.children.length; i++) {
            let obj = TE.scene.children[i];
            if (obj.userData['type']) {
                TE.scene.remove(obj);
                i--;
            }
        }

        TE.INTERSECTED = null;
        TE.transformControl.detach(TE.transformControl.object);
    },

};

