const RAY_BEGIN_A = 10;
const RAY_BEGIN_B = 11;
const MIRROR_BEGIN_A = 12;
const MIRROR_BEGIN_B = 13;
const BEAM_BEGIN_A = 14;
const BEAM_BEGIN_B = 15;

const NOTHING = 20;

class App {
    constructor() {
        w.cv = d.getElementById("cv");
        w.ctx = cv.getContext("2d");

        this.resize();

        w.t0 = Date.now();

        this.mode = NOTHING;
        this.ray_added_id = 0;
        this.beam_added_id = 0;
        this.mirror_added_id = 0;

        w.omp = new Vec2(0, 0);
        w.mp = new Vec2(0, 0);
        w.msdown = 0;

        this.init_cb();


        w.rays = [];
        w.beams = [];
        w.mirrors = []
        w.lens = [];

        
        w.rays.push(new Ray(new Vec2(-100, 100), new Vec2(-90, 100), true));

        w.mirrors.push(new Mirror(new Vec2(0, 175), new Vec2(175, 0), 1));

        w.fps = new FPS();
        w.grid = new Grid(25, 25, 8, 'rgb(200, 0, 255)', 'rgb(255, 0, 0)');
    }

    init_cb() {
        w.cv.addEventListener('mousedown', x => {
            w.ptime = Date.now();
            w.msdown = true;
        });
        w.cv.addEventListener('mouseup', x => {
            w.ltime = Date.now() - w.ptime;
            w.msdown = false;
        });

        /* Buttons */
        d.getElementById('rb0').addEventListener('click', x => {
            this.mode = RAY_BEGIN_A;
        });

        d.getElementById('mb0').addEventListener('click', x => {
            this.mode = MIRROR_BEGIN_A;
        });
        
        d.getElementById('bb0').addEventListener('click', x => {
            this.mode = BEAM_BEGIN_A;
        });

        d.getElementById('nb0').addEventListener('click', x => {
            this.mode = this.MODE_NONE;
        });

        w.cv.addEventListener('mousemove', this.mousemove);
        w.cv.addEventListener('click', this.click.bind(this));
        w.addEventListener('resize', this.resize, false);
    }

    resize() {
        cv.width = w.innerWidth - 4;
        cv.height = w.innerHeight - $("#pan0").height() - 5;
    }

    mousemove(evt) {
        var rect = cv.getBoundingClientRect();
        w.omp = new Vec2( (evt.clientX - rect.left),
                          (evt.clientY - rect.top) );
        w.mp = new Vec2(-(cv.width/2.0 - (evt.clientX - rect.left)),
                         (cv.height/2.0 - (evt.clientY - rect.top)) );
    }

    // Click on canvas callback
    click(evt) {
        if(this.mode == RAY_BEGIN_A) {
            w.rays.push(new Ray(mp, mp));
            this.ray_added_id = w.rays.length - 1;
            this.mode = RAY_BEGIN_B;
        }
        else if(this.mode == RAY_BEGIN_B) {
            w.rays[this.ray_added_id].dir = mp;
            this.mode = NOTHING;
        }
        else if(this.mode == MIRROR_BEGIN_A) {
            w.mirrors.push(new Mirror(mp, mp));
            this.mirror_added_id = w.mirrors.length - 1;
            this.mode = MIRROR_BEGIN_B;
        }
        else if(this.mode == MIRROR_BEGIN_B) {
            w.mirrors[this.mirror_added_id].dir = mp;
            this.mode = NOTHING;
        }
        else if(this.mode == BEAM_BEGIN_A) {
            w.beams.push(new Beam(mp, mp, 10));
            this.beam_added_id = w.beams.length - 1;
            this.mode = BEAM_BEGIN_B;
        }
        else if(this.mode == BEAM_BEGIN_B) {
            w.beams[this.beam_added_id].dir = mp;
            this.mode = NOTHING;
        }

    }

    // Just update all rays
    update_all_rays() {
        for(let i=0;i<w.rays.length;++i) {
            w.rays[i].need_update = true;
        }
    }

    // If adding mirror or ray
    // animate it when moving mouse
    update_ray_add() {
        if(this.mode == RAY_BEGIN_B) {
            w.rays[this.ray_added_id].dir = mp;
            w.rays[this.ray_added_id].generate_points();
            w.rays[this.ray_added_id].need_update = true;
        }
        else if(this.mode == BEAM_BEGIN_B) {
            let b = w.beams[this.beam_added_id];
            b.dir = mp;
            b.brays = [];
            b.init_rays(b.density);
        }
        else if(this.mode == MIRROR_BEGIN_B) {
            w.mirrors[this.mirror_added_id].dir = mp;
            this.update_all_rays();
        }
    }

    /* Just render app */
    render() {
        w.t = Date.now() - w.t0;
        fps.begin();


        // Clear canvas
        ctx.clearRect(0, 0, cv.width, cv.height);
        this.update_ray_add();

        w.rid = 0;

        /*
         * Draw all rays
         */
        for(let i=0;i<w.rays.length;++i) {
            let r = w.rays[i];
            r.draw(++rid);
        }

        /*
         * ... all beams
         */
        for(let i=0;i<w.beams.length;++i) {
            let b = w.beams[i];
            b.draw();
            for(let j=0;j<b.brays.length;++j) 
                b.brays[j].draw(++rid);   
            
        }

        /*
         * And all mirrors
         */
        for(let i=0;i<w.mirrors.length;++i) {
            let m = w.mirrors[i];
            m.draw();
        }

        for(let i=0;i<w.lens.length;++i) {
            let l = w.lens[i];
            l.draw();
        }

        /* 
         * Draw grid and fps
         * nothing important
         */
        grid.draw();
        fps.draw();
        //throw '';
        requestAnimationFrame(this.render.bind(this));
    }

    run() {
        this.render();
    }
}
