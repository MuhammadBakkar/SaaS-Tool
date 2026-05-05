import fs from 'node:fs';
import path from 'node:path';
const lchownSync = (path, uid, gid) => {
    try {
        return fs.lchownSync(path, uid, gid);
    }
    catch (er) {
        if (er?.code !== 'ENOENT')
            throw er;
    }
};
const chown = (cpath, uid, gid, cb) => {
    fs.lchown(cpath, uid, gid, er => {
        // Skip ENOENT error
        cb(er && er?.code !== 'ENOENT' ? er : null);
    });
};
const chownrKid = (p, child, uid, gid, cb) => {
    if (child.isDirectory()) {
        chownr(path.resolve(p, child.name), uid, gid, (er) => {
            if (er)
                return cb(er);
            const cpath = path.resolve(p, child.name);
            chown(cpath, uid, gid, cb);
        });
    }
    else {
        const cpath = path.resolve(p, child.name);
        chown(cpath, uid, gid, cb);
    }
};
export const chownr = (p, uid, gid, cb) => {
    fs.readdir(p, { withFileTypes: true }, (er, children) => {
        // any error other than ENOTDIR or ENOTSUP 