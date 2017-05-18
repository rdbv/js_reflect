'use strict';

/* Point between a and b */
function midpoint(a, b) {
    return new Vec2( (a.x+b.x)/2.0, (a.y+b.y)/2.0 );
}

/* Intersection with ray and segment */
function inter(ray,segment){
    ray.a = ray.origin;
    ray.b = ray.dir;
    segment.a = segment.origin;
    segment.b = segment.dir; 

	var r_px = ray.a.x;
	var r_py = ray.a.y;
	var r_dx = ray.b.x-ray.a.x;
	var r_dy = ray.b.y-ray.a.y;
	var s_px = segment.a.x;
	var s_py = segment.a.y;
	var s_dx = segment.b.x-segment.a.x;
	var s_dy = segment.b.y-segment.a.y;
	var r_mag = Math.sqrt(r_dx*r_dx+r_dy*r_dy);
	var s_mag = Math.sqrt(s_dx*s_dx+s_dy*s_dy);

	if(r_dx/r_mag==s_dx/s_mag && r_dy/r_mag==s_dy/s_mag)
		return null;

	var T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx);
	var T1 = (s_px+s_dx*T2-r_px)/r_dx;

	if( (T1<0) || (T2<0 || T2>1) ) 
        return null;

	return {
        p : new Vec2(r_px+r_dx*T1, r_py+r_dy*T1),
		param: T1,
        m : segment
	};
}

/* FPS info */
class FPS {
    constructor() {
        this.last = 0;
        this.frames_sum = 0;
        this.frame_no = 0;
        this.frame = 0;
        this.fps_avg = 0;
        this.frame_count = 30.0;
        this.delta = 0;
    }

    begin() {
        this.frame++;
        this.delta = (Date.now() - this.last) / 1000;
        this.last = Date.now();
        let fps = (1 / this.delta);

        if(this.frame_no != this.frame_count) {
            this.frames_sum += fps;
            this.frame_no++;
        }
        else {
            this.frames_sum /= this.frame_count;
            this.fps_avg = this.frames_sum; 
            this.frames_sum = this.frame_no = 0;
        }
    }
    
    get_time() {
        return this.frame / 60.0;
    }

    draw() {
        ctx.font = '12px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText("FPS:"+(this.fps_avg).toFixed(2), 0, 12);
    }

};

class Grid {
    constructor(dist_x, dist_y, fsize, colx, coly) {
        this.fsize = fsize;
        this.dist_x = dist_x;
        this.dist_y = dist_y;
        this.colx = colx;
        this.coly = coly;
        this.bar_x = Math.trunc(cv.width / this.dist_x);
        this.bar_y = Math.trunc(cv.height / this.dist_y);
    }

    draw() {
        ctx.save();
        /* Center */
        ctx.translate(cv.width * 0.5, cv.height * 0.5);
        ctx.strokeStyle = 'gray';

        /* Axis */
        ctx.beginPath();

            ctx.moveTo(-cv.width, 0);
            ctx.lineTo(cv.width, 0);
            ctx.moveTo(0, -cv.height);
            ctx.lineTo(0, cv.height);
            ctx.stroke();

        /* Numbers */
        ctx.font = this.fsize+'px Arial';
        ctx.fillStyle = this.colx;
        ctx.strokeStyle = 'gray';
        for(var x=-(this.bar_x/2.0)+1;x<(this.bar_x/2.0);++x) {
            ctx.beginPath();
            ctx.moveTo(x*this.dist_x, 5);
            ctx.lineTo(x*this.dist_x, -5);
            ctx.stroke();
            var m = ctx.measureText(x*this.dist_x).width / 2.0;
            if(x!=0)
                ctx.fillText(x*this.dist_x, x*this.dist_x-m, -10);
            ctx.closePath();
        }
        ctx.fillStyle = this.coly;
        for(var y=-(this.bar_y/2.0)+1;y<(this.bar_y/2.0);++y) {
            ctx.beginPath();
            ctx.moveTo(-5, y*this.dist_y);
            ctx.lineTo(5, y*this.dist_y);
            ctx.stroke();
            var m = this.fsize / 3.0;
            if(y!=0)
                ctx.fillText(y*-this.dist_y, 10, y*this.dist_y+m);
            ctx.closePath();
        } 

        ctx.restore();
    }

};

class Vec2 {
    constructor(x, y) {
        this.x = x, this.y = y;
        return this;
    }

    add(v) {
        if(typeof(v) === "object") this.x += v.x, this.y += v.y;
        if(typeof(v) === "number") this.x += v, this.y += v;
        return this;
    }

    sub(v) {
        if(typeof(v) === "object") this.x -= v.x, this.y -= v.y;
        if(typeof(v) === "number") this.x -= v, this.y -= v;
        return this;
    }
    
    mul(v) {
        if(typeof(v) === "object") this.x *= v.x, this.y *= v.y;
        if(typeof(v) === "number") this.x *= v, this.y *= v;
        return this;
    }
    
    div(v) {
        if(typeof(v) === "object") this.x /= v.x, this.y /= v.y;
        if(typeof(v) === "number") this.x /= v, this.y /= v;
        return this;
    }

    cross(x) {
        return this.x * x.y - this.y * x.x;
    }

    as_string() {
        return this.x + ' ' + this.y;
    }

    rotate(x) {
        var ca = Math.cos(x);
        var sa = Math.sin(x);
        this.x = ca * this.x - sa * this.y;
        this.y = sa * this.x + ca * this.y;
    }

    gt(v) {
        return this.x >= v.x && this.y >= v.y;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    
    normalize() {
        let l = this.length();
        if(l == 0){
            return this;
        }
        this.x = this.x / l;
        this.y = this.y / l;
        return this;
    }

    length() {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    angle(v) {
        let cos_theta = this.dot(v) / (this.length() * v.length());
        let angle = Math.acos(cos_theta);
        return angle;
    }

    copy() {
        return new Vec2(this.x, this.y);
    }

    trunc() {
        return new Vec2(Math.trunc(this.x), Math.trunc(this.y));
    }

    cmp(v) {
        return this.x == v.x && this.y == v.y;
    }


};

