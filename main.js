var w = window;
var d = document;
var omp, mp, msdown;

// cline
class Line {

    /*
     * Create line from O, to D
     */
    constructor(o, d, mv = true, dbg = false) {
        this.origin = o, this.dir = d;
        this.slope = 0.0;
        this.dbg = dbg;
        this.is_movable = mv;
        this.lockedb = this.lockede = this.lockedc = false;
        this.mid = new Vec2(0, 0), this.off = new Vec2(0, 0);
        this.far = this.last_c = this.last_e = this.last_b = new Vec2(0, 0);
        this.need_update = true;
        this.generate_points();
    }


    generate_points(q) {
        /* Calculate slope */        
        this.slope = (this.dir.y - this.origin.y) / 
                     (this.dir.x - this.origin.x);

        if(this.slope == Infinity)  this.slope = -1000;
        if(this.slope == -Infinity) this.slope = 1000;

        /* Calculate far points */
        if(this.dir.x > this.origin.x) {
            this.far.x = this.origin.x + 1600;
            this.far.y = this.origin.y + this.slope * 1600;
        }
        else {
            this.far.x = this.origin.x - 1600;
            this.far.y = this.origin.y - this.slope * 1600;
        }

        /* Midpoint, between O and D */        
        this.mid = new Vec2( (this.origin.x + this.dir.x) / 2.0,
                             (this.origin.y + this.dir.y) / 2.0 );
    }

    // Handle input
    draw_handles() {
        if(!this.is_movable)
            return;
        if(!w.msdown)
            this.lockedb = this.lockede = this.lockedc = false;

        if(this.lockedc) {
            this.origin.add(this.off);
            this.dir.add(this.off);                
            this.off = new Vec2(0, 0);
            this.generate_points();
        }

        let begin_p  = new Path2D(),
            end_p    = new Path2D(),
            center_p = new Path2D();

        let origin = this.origin.copy();
        let dir = this.dir.copy();

        let ps = 2.5;

        begin_p.rect(origin.x - ps, origin.y - ps, ps*2, ps*2);
        end_p.rect(dir.x - ps, dir.y - ps, ps*2, ps*2);
        center_p.rect((this.mid.x + this.off.x) - ps,
                      (this.mid.y + this.off.y) - ps, ps*2, ps*2);

        let ms_on_b = ctx.isPointInPath(begin_p, Math.trunc(omp.x), Math.trunc(omp.y));
        let ms_on_e = ctx.isPointInPath(end_p, Math.trunc(omp.x), Math.trunc(omp.y));
        let ms_on_c = ctx.isPointInPath(center_p,Math.trunc(omp.x), Math.trunc(omp.y));

        let center_on = this.as_dir().length() > 25;

        if(this.lockedb && this.lockede) 
            this.lockedb = true, this.lockede = false;

        if( (ms_on_b && w.msdown) || this.lockedb ) {
            this.origin = new Vec2(mp.x, mp.y);
            this.need_update = !this.origin.cmp(this.last_b);;
            this.last_b = this.origin.copy();
            this.lockedb = true;
            this.generate_points(1);
        }
        if( (ms_on_e && w.msdown) || this.lockede ) {
            this.dir =  new Vec2(mp.x, mp.y);
            this.lockede = true;
            this.need_update = !this.dir.cmp(this.last_e);
            this.last_e = this.dir.copy();
            this.generate_points(1);
        }

        if( (ms_on_c && w.msdown && center_on) || this.lockedc ) {
            this.off = new Vec2(mp.x - this.mid.x, 
                                mp.y - this.mid.y);
            this.need_update = !this.last_c.cmp(this.off);
            this.lockedc = true;
            this.last_c = this.off.copy();
        }

        ctx.fillStyle = 'blue', ctx.fill(begin_p);
        ctx.fillStyle = 'red', ctx.fill(end_p);
        ctx.fillStyle = 'green';


        if(center_on) 
            ctx.fill(center_p);
    }

    as_dir() {
        return this.dir.copy().sub(this.origin);
    }

    get_normal(p, t) {
        let nl = this.as_dir().normalize();
        if(t == 1) {
            nl.mul(25);
            return new Vec2(-nl.y+p.x, nl.x+p.y);
        }
        else 
            return new Vec2(-nl.y, nl.x);
    }

    draw_normal(p) {
        let normal = this.get_normal(p, 1);
        ctx.beginPath();
            ctx.strokeStyle = 'red';
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(normal.x, normal.y);        
            ctx.stroke();
        ctx.closePath();
    }

    draw() {
        ctx.save();
        ctx.translate(cv.width * 0.5, cv.height * 0.5);
        ctx.scale(1, -1);

        ctx.beginPath();
        this.draw_handles();
            ctx.strokeStyle = 'yellow';
            ctx.moveTo(this.origin.x + this.off.x, this.origin.y + this.off.y);
            ctx.lineTo(this.dir.x + this.off.x, this.dir.y + this.off.y);
            ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }

};

// cray
class Ray extends Line {
    constructor(pos, dir, mv = true, dbg = false) {
        super(pos, dir, mv, dbg);
        this.trace = [];
    }
  
    cast_ray() {
        let r = this;
        let is = null;
        let rid =0;
        let i = 0; 
        let ref = null;
        let cutoff = false;
        this.trace = [];

        while( (is = get_closest_intersection(r, rid)) != null ){
            if(!i) {
                this.trace.push(new Ray(
                            new Vec2(r.origin.x+r.off.x, r.origin.y+r.off.y),
                            new Vec2(is.p.x, is.p.y)
                            ));
                i++;
                continue;
            }
            else {
                // Not first
                if(cutoff) {
                    this.trace.push(new Ray(
                                new Vec2(r.origin.x+r.off.x, r.origin.y+r.off.y),
                                new Vec2(is.p.x, is.p.y)
                                ));

                }

                rid = is.m.id;
                ref = reflect(r, is);
                r = new Ray(new Vec2(is.p.x, is.p.y), 
                            new Vec2(Math.round(ref.x), Math.round(ref.y) ), false, true);
                cutoff = true;
            }
        
        }
        if(ref != null) {
            this.trace.push(new Ray(
                        new Vec2(r.origin.x, r.origin.y),
                        new Vec2(r.far.x, r.far.y)));
        }
    }

    draw_trace() {
        ctx.strokeStyle = 'yellow';

        // Not reflected
        if(!this.trace.length) {
            ctx.moveTo(this.origin.x+this.off.x, this.origin.y+this.off.y);
            ctx.lineTo(this.far.x, this.far.y);
            ctx.stroke();
            return;
        }

        // Reflected   
        // So, draw trace
        for(let i=0;i<this.trace.length;++i) {
            let r = this.trace[i];
            ctx.beginPath();
                ctx.moveTo(r.origin.x, r.origin.y);
                ctx.lineTo(r.dir.x, r.dir.y);
                ctx.stroke();
            ctx.closePath();
        }
    }

    /* 
     * Draw line from beginning to end,
     * and from end to far points 
     */
    draw(i) {
        ctx.save();
        ctx.translate(cv.width * 0.5, cv.height * 0.5);
        ctx.scale(1, -1);

        ctx.beginPath();
        super.draw_handles();

        ctx.beginPath();
        ctx.strokeStyle = 'red';

        // If need update (ray moved)
        // or if any mirror moved (then recalculate all rays)
        // it is quite unoptimal, but we can use it here
        if(this.need_update || any_mirror_moved()) {
            this.cast_ray();
            this.need_update = false;

            // Is last ray?
            if(i == ray_total_count()) {
                mirror_updated();
            }
            
        }

        this.draw_trace();

        ctx.closePath();
        ctx.restore();
    }
};

// cbeam
class Beam extends Line {
    constructor(a, b, density) {
        super(a, b);
        this.brays = [];
        this.density = density ;
        this.init_rays(density);
    }

    init_rays(n) {
        let x1 = this.origin.x, y1 = this.origin.y;
        let x2 = this.dir.x, y2 = this.dir.y; 
        let dx = (x2 - x1) / n, dy = (y2 - y1) / n;
        for(let i=1;i<n;++i) {
            let v = new Vec2(x1+i*dx, y1+i*dy);
            let e = this.get_normal(v, 1);
            this.brays.push(new Ray(v, e, false));
        }
        this.brays.push(new Ray(this.origin, this.get_normal(this.origin, 1), false) );
        this.brays.push(new Ray(this.dir, this.get_normal(this.dir, 1), false) );
                        
    }

    draw() {
        ctx.save();
        ctx.translate(cv.width * 0.5, cv.height * 0.5);
        ctx.scale(1, -1);
       
        this.draw_handles();

        ctx.beginPath();
        ctx.strokeStyle = 'violet';

        ctx.moveTo(this.origin.x, this.origin.y);
        ctx.lineTo(this.dir.x, this.dir.y);
        ctx.stroke();

        ctx.closePath();

        if(this.need_update) {
            this.brays = [];
            this.init_rays(this.density);
            this.need_update = false;
        }
        

        ctx.restore();

    }

};

// cmirr
class Mirror extends Line {

    constructor(pos, dir, id) {
        super(pos, dir);
        if(id)
            this.id = id;
        else {
            this.id = get_highest_id();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(cv.width * 0.5, cv.height * 0.5);
        ctx.scale(1, -1);

        ctx.beginPath();

            ctx.strokeStyle = 'silver';
            ctx.moveTo(this.origin.x + this.off.x, this.origin.y + this.off.y);
            ctx.lineTo(this.dir.x + this.off.x, this.dir.y + this.off.y);
            ctx.stroke();
            
            super.draw_handles();

        ctx.closePath();

        ctx.restore();
    }
};

// clens
class Lens extends Line {
    constructor(a, b) {
        super(a, b);
    }

    draw() {
        ctx.save();
        ctx.translate(cv.width * 0.5, cv.height * 0.5);
        ctx.scale(1, -1);

        ctx.beginPath();
            ctx.strokeStyle = 'red';
            ctx.moveTo(this.origin.x + this.off.x, this.origin.y + this.off.y);
            ctx.lineTo(this.dir.x + this.off.x, this.dir.y + this.off.y);
            ctx.stroke();
            super.draw_handles();
        ctx.closePath();

        ctx.restore();
    }

};


function any_mirror_moved() {
    for(let i=0;i<w.mirrors.length;++i) {
        if(w.mirrors[i].need_update) {
            //console.log("MMVO");
            return true;
        }
    }
    return false;
}

function mirror_updated() {
    for(let i=0;i<w.mirrors.length;++i) {
        w.mirrors[i].need_update = false;
    }
}

function get_highest_id() {
    let highest = (w.mirrors.length)?w.mirrors[0].id:0;
    for(let i=0;i<w.mirrors.length;++i) {
        if(w.mirrors[i].id > highest)
            highest = w.mirrors[i].id;
    }
    return highest + 1;
}

function get_closest_intersection(r, rid = 0) {
    let ists = [], istx = [];
    for(let i=0;i<w.mirrors.length;++i) {
        let m = w.mirrors[i];
        if(m.id == rid)
            continue;
        let is = inter(r, m);
        if(is) ists.push(is), istx.push(is.param);
    }
    let closest = Math.min.apply(Math, istx);
    for(let i=0;i<ists.length;++i) {
        if(ists[i].param == closest)
            return ists[i];
    }
    return null;
}

/* 
 * Return count of all rays (single rays + beam rays)
 */
function ray_total_count() {
    let s = w.rays.length;;
    for(let i=0;i<w.beams.length;++i) 
        s += w.beams[i].brays.length;
    return s;    
}

/* 
 * Just generate reflection point
 */
function reflect(r, it) {
    let d = r.as_dir();
    let n = it.m.get_normal(it.p, 0);
    let ddn = d.dot(n);
    let dx = d.x - 2*ddn*n.x;
    let dy = d.y - 2*ddn*n.y;

    let a1 = (dy - (it.p.y+r.off.y)) /
             (dx - (it.p.x+r.off.x));

    return new Vec2(1024*dx+it.p.x, 1024*dy+it.p.y);
}

