"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginLicenseTypeIdentifier = void 0;
var PluginLicenseTypeIdentifier = /** @class */ (function () {
    function PluginLicenseTypeIdentifier(logger, licenseTypeOverrides, preferredLicenseTypes, handleLicenseAmbiguity, handleMissingLicenseType) {
        this.logger = logger;
        this.licenseTypeOverrides =