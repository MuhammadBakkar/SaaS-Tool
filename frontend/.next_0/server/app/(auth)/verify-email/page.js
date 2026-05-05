import { __extends, __read, __spreadArray, __values } from "tslib";
import { Observable } from '../Observable';
import { ColdObservable } from './ColdObservable';
import { HotObservable } from './HotObservable';
import { SubscriptionLog } from './SubscriptionLog';
import { VirtualTimeScheduler, VirtualAction } from '../scheduler/VirtualTimeScheduler';
import { COMPLETE_NOTIFICATION, errorNotification, nextNotification } from '../NotificationFactories';
import { dateTimestampProvider } from '../scheduler/dateTimestampProvider';
import { performanceTimestampProvider } from '../scheduler/performanceTimestampProvider';
import { animationFrameProvider } from '../scheduler/animationFrameProvider';
import { immediateProvider } from '../scheduler/immediateProvider';
import { intervalProvider } from '../scheduler/intervalProvider';
import { timeoutProvider } from '../scheduler/timeoutProvider';
var defaultMaxFrame = 750;
var TestScheduler = (function (_super) {
    __extends(TestScheduler, _super);
    function TestScheduler(assertDeepEqual) {
        var _this = _super.call(this, VirtualAction, defaultMaxFrame) || this;
        _this.assertDeepEqual = assertDeepEqual;
        _this.hotObservables = [];
        _this.coldObservables = [];
        _this.flushTests = [];
        _this.runMode = false;
        return _this;
    }
    TestScheduler.prototype.createTime = function (marbles) {
        var indexOf = this.runMode ? marbles.trim().indexOf('|') : marbles.indexOf('|');
        if (indexOf === -1) {
            throw new Error('marble diagram for time should have a completion marker "|"');
        }
        return indexOf * TestScheduler.frameTimeFactor;
    };
    TestScheduler.prototype.createColdObservable = function (marbles, values, error) {
        if (marbles.indexOf('^') !== -1) {
            throw new Error('cold observable cannot have subscription offset "^"');
        }
        if (marbles.indexOf('!') !== -1) {
            throw new Error('cold observable cannot have unsubscription marker "!"');
        }
        var messages = TestScheduler.parseMarbles(marbles, values, error, undefined, this.runMode);
        var cold = new ColdObservable(messages, this);
        this.coldObservables.push(cold);
        return cold;
    };
    TestScheduler.prototype.createHotObservable = function (marbles, values, error) {
        if (marbles.indexOf('!') !== -1) {
            throw new Error('hot observable cannot have unsubscription marker "!"');
        }
        var messages = TestScheduler.parseMarbles(marbles, values, error, undefined, this.runMode);
        var subject = new HotObservable(messages, this);
        this.hotObservables.push(subject);
        return subject;
    };
    TestScheduler.prototype.materializeInnerObservable = function (observable, outerFrame) {
        var _this = this;
        var messages = [];
        observable.subscribe({
            next: function (value) {
                messages.push({ frame: _this.frame - outerFrame, notification: nextNotification(value) });
            },
            error: function (error) {
                messages.push({ frame: _this.frame - outerFrame, notification: errorNotification(error) });
            },
            complete: function () {
                messages.push({ frame: _this.frame - outerFrame, notification: COMPLETE_NOTIFICATION });
            },
        });
        return messages;
    };
    TestScheduler.prototype.expectObservable = function (observable, subscriptionMarbles) {
        var _this = this;
        if (subscriptionMarbles === void 0) { subscriptionMarbles = null; }
        var actual = [];
        var flushTest = { actual: actual, ready: false };
        var subscriptionParsed = TestScheduler.parseMarblesAsSubscriptions(subscriptionMarbles, this.runMode);
        var subscriptionFrame = subscriptionParsed.subscribedFrame === Infinity ? 0 : subscriptionParsed.subscribedFrame;
        var unsubscriptionFrame = subscriptionParsed.unsubscribedFrame;
        var subscription;
        this.schedule(function () {
            subscription = observable.subscribe({
                next: function (x) {
                    var value = x instanceof Observable ? _this.materializeInnerObservable(x, _this.frame) : x;
                    actual.push({ frame: _this.frame, notification: nextNotification(value) });
                },
                error: function (error) {
                    actual.push({ frame: _this.frame, notification: errorNotification(error) });
                },
                complete: function () {
                    actual.push({ frame: _this.frame, notification: COMPLETE_NOTIFICATION });
                },
            });
        }, subscriptionFrame);
        if (unsubscriptionFrame !== Infinity) {
            this.schedule(function () { return subscription.unsubscribe(); }, unsubscriptionFrame);
        }
        this.flushTests.push(flushTest);
        var runMode = this.runMode;
        return {
            toBe: function (marbles, values, errorValue) {
                flushTest.ready = true;
                flushTest.expected = TestScheduler.parseMarbles(marbles, values, errorValue, true, runMode);
            },
            toEqual: function (other) {
                flushTest.ready = true;
                flushTest.expected = [];
                _this.schedule(function () {
                    subscription = other.subscribe({
                        next: function (x) {
                            var value = x instanceof Observable ? _this.materializeInnerObservable(x, _this.frame) : x;
                            flushTest.expected.push({ frame: _this.frame, notification: nextNotification(value) });
                        },
                        error: function (error) {
                            flushTest.expected.push({ frame: _this.frame, notification: errorNotification(error) });
                        },
                        complete: function () {
                            flushTest.expected.push({ frame: _this.frame, notification: COMPLETE_NOTIFICATION });
                        },
                    });
                }, subscriptionFrame);
            },
        };
    };
    TestScheduler.prototype.expectSubscriptions = function (actualSubscriptionLogs) {
        var flushTest = { actual: actualSubscriptionLogs, ready: false };
        this.flushTests.push(flushTest);
        var runMode = this.runMode;
        return {
            toBe: function (marblesOrMarblesArray) {
                var marblesArray = typeof marblesOrMarblesArray === 'string' ? [marblesOrMarblesArray] : marblesOrMarblesArray;
                flushTest.ready = true;
                flushTest.expected = marblesArray
                    .map(function (marbles) { return TestScheduler.parseMarblesAsSubscriptions(marbles, runMode); })
                    .filter(function (marbles) { return marbles.subscribedFrame !== Infinity; });
            },
        };
    };
    TestScheduler.prototype.flush = function () {
        var _this = this;
        var hotObservables = this.hotObservables;
        while (hotObservables.length > 0) {
            hotObservables.shift().setup();
        }
        _super.prototype.flush.call(this);
        this.flushTests = this.flushTests.filter(function (test) {
            if (test.ready) {
                _this.assertDeepEqual(test.actual, test.expected);
                return false;
            }
            return true;
        });
    };
    TestScheduler.parseMarblesAsSubscriptions = function (marbles, runMode) {
        var _this = this;
        if (runMode === void 0) { runMode = false; }
        if (typeof marbles !== 'string') {
            return new SubscriptionLog(Infinity);
        }
        var characters = __spreadArray([], __read(marbles));
        var len = characters.length;
        var groupStart = -1;
        var subscriptionFrame = Infinity;
        var unsubscriptionFrame = Infinity;
        var frame = 0;
        var _loop_1 = function (i) {
            var nextFrame = frame;
            var advanceFrameBy = function (count) {
                nextFrame += count * _this.frameTimeFactor;
            };
            var c = characters[i];
            switch (c) {
                case ' ':
                    if (!runMode) {
                        advanceFrameBy(1);
                    }
                    break;
                case '-':
                    advanceFrameBy(1);
                    break;
                case '(':
                    groupStart = frame;
                    advanceFrameBy(1);
                    break;
                case ')':
                    groupStart = -1;
                    advanceFrameBy(1);
                    break;
                case '^':
                    if (subscriptionFrame !== Infinity) {
                        throw new Error("found a second subscription point '^' in a " + 'subscription marble diagram. There can only be one.');
                    }
                    subscriptionFrame = groupStart > -1 ? groupStart : frame;
                    advanceFrameBy(1);
                    break;
                case '!':
                    if (unsubscriptionFrame !== Infinity) {
                        throw new Error("found a second unsubscription point '!' in a " + 'subscription marble diagram. There can only be one.');
                    }
                    unsubscriptionFrame = groupStart > -1 ? groupStart : frame;
                    break;
                default:
                    if (runMode && c.match(/^[0-9]$/)) {
                        if (i === 0 || characters[i - 1] === ' ') {
                            var buffer = characters.slice(i).join('');
                            var match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);
                            if (match) {
                                i += match[0].length - 1;
                                var duration = parseFloat(match[1]);
                                var unit = match[2];
                                var durationInMs = void 0;
                                switch (unit) {
                                    case 'ms':
                                        durationInMs = duration;
                                        break;
                                    case 's':
                                        durationInMs = duration * 1000;
                                        break;
                                    case 'm':
                                        durationInMs = duration * 1000 * 60;
                                        break;
                                    default:
                                        break;
                                }
                                advanceFrameBy(durationInMs / this_1.frameTimeFactor);
                                break;
                            }
                        }
                    }
                    throw new Error("there can only be '^' and '!' markers in a " + "subscription marble diagram. Found instead '" + c + "'.");
            }
            frame = nextFrame;
            out_i_1 = i;
        };
        var this_1 = this, out_i_1;
        for (var i = 0; i < len; i++) {
            _loop_1(i);
            i = out_i_1;
        }
        if (unsubscriptionFrame < 0) {
            return new SubscriptionLog(subscriptionFrame);
        }
        else {
            return new SubscriptionLog(subscriptionFrame, unsubscriptionFrame);
        }
    };
    TestScheduler.parseMarbles = function (marbles, values, errorValue, materializeInnerObservables, runMode) {
        var _this = this;
        if (materializeInnerObservables === void 0) { materializeInnerObservables = false; }
        if (runMode === void 0) { runMode = false; }
        if (marbles.indexOf('!') !== -1) {
            throw new Error('conventional marble diagrams cannot have the ' + 'unsubscription marker "!"');
        }
        var characters = __spreadArray([], __read(marbles));
        var len = characters.length;
        var testMessages = [];
        var subIndex = runMode ? marbles.replace(/^[ ]+/, '').indexOf('^') : marbles.indexOf('^');
        var frame = subIndex === -1 ? 0 : subIndex * -this.frameTimeFactor;
        var getValue = typeof values !== 'object'
            ? function (x) { return x; }
            : function (x) {
                if (materializeInnerObservables && values[x] instanceof ColdObservable) {
                    return values[x].messages;
                }
                return values[x];
            };
        var groupStart = -1;
        var _loop_2 = function (i) {
            var nextFrame = frame;
            var advanceFrameBy = function (count) {
                nextFrame += count * _this.frameTimeFactor;
            };
            var notification = void 0;
            var c = characters[i];
            switch (c) {
                case ' ':
                    if (!runMode) {
                        advanceFrameBy(1);
                    }
                    break;
                case '-':
                    advanceFrameBy(1);
                    break;
                case '(':
                    groupStart = frame;
                    advanceFrameBy(1);
                    break;
                case ')':
                    groupStart = -1;
                    advanceFrameBy(1);
                    break;
                case '|':
                    notification = COMPLETE_NOTIFICATION;
                    advanceFrameBy(1);
                    break;
                case '^':
                    advanceFrameBy(1);
                    break;
                case '#':
                    notification = errorNotification(errorValue || 'error');
                    advanceFrameBy(1);
                    break;
                default:
                    if (runMode && c.match(/^[0-9]$/)) {
                        if (i === 0 || characters[i - 1] === ' ') {
                            var buffer = characters.slice(i).join('');
                            var match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);
                            if (match) {
                                i += match[0].length - 1;
                                var duration = parseFloat(match[1]);
                                var unit = match[2];
                                var durationInMs = void 0;
                                switch (unit) {
                                    case 'ms':
                                        durationInMs = duration;
                                        break;
                                    case 's':
                                        durationInMs = duration * 1000;
                                        break;
                                    case 'm':
                                        durationInMs = duration * 1000 * 60;
                                        break;
                                    default:
                                        break;
                                }
                                advanceFrameBy(durationInMs / this_2.frameTimeFactor);
                                break;
                            }
                        }
                    }
                    notification = nextNotification(getValue(c));
                    advanceFrameBy(1);
                    break;
            }
            if (notification) {
                testMessages.push({ frame: groupStart > -1 ? groupStart : frame, notification: notification });
            }
            frame = nextFrame;
            out_i_2 = i;
        };
        var this_2 = this, out_i_2;
        for (var i = 0; i < len; i++) {
            _loop_2(i);
            i = out_i_2;
        }
        return testMessages;
    };
    TestScheduler.prototype.createAnimator = function () {
        var _this = this;
        if (!this.runMode) {
            throw new Error('animate() must only be used in run mode');
        }
        var lastHandle = 0;
        var map;
        var delegate = {
            requestAnimationFrame: function (callback) {
                if (!map) {
                    throw new Error('animate() was not called within run()');
                }
                var handle = ++lastHandle;
                map.set(handle, callback);
                return handle;
            },
            cancelAnimationFrame: function (handle) {
                if (!map) {
                    throw new Error('animate() was not called within run()');
                }
                map.delete(handle);
            },
        };
        var animate = function (marbles) {
            var e_1, _a;
            if (map) {
                throw new Error('animate() must not be called more than once within run()');
            }
            if (/[|#]/.test(marbles)) {
                throw new Error('animate() must not complete or error');
            }
            map = new Map();
            var messages = TestScheduler.parseMarbles(marbles, undefined, undefined, undefined, true);
            try {
                for (var messages_1 = __values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
                    var message = messages_1_1.value;
                    _this.schedule(function () {
                        var e_2, _a;
                        var now = _this.now();
                        var callbacks = Array.from(map.values());
                        map.clear();
                        try {
                            for (var callbacks_1 = (e_2 = void 0, __values(callbacks)), callbacks_1_1 = callbacks_1.next(); !callbacks_1_1.done; callbacks_1_1 = callbacks_1.next()) {
                                var callback = callbacks_1_1.value;
                                callback(now);
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (callbacks_1_1 && !callbacks_1_1.done && (_a = callbacks_1.return)) _a.call(callbacks_1);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    }, message.frame);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        return { animate: animate, delegate: delegate };
    };
    TestScheduler.prototype.createDelegates = function () {
        var _this = this;
        var lastHandle = 0;
        var scheduleLookup = new Map();
        var run = function () {
            var now = _this.now();
            var scheduledRecords = Array.from(scheduleLookup.values());
            var scheduledRecordsDue = scheduledRecords.filter(function (_a) {
                var due = _a.due;
                return due <= now;
            });
            var dueImmediates = scheduledRecordsDue.filter(function (_a) {
                var type = _a.type;
                return type === 'immediate';
            });
            if (dueImmediates.length > 0) {
                var _a = dueImmediates[0], handle = _a.handle, handler = _a.handler;
                scheduleLookup.delete(handle);
                handler();
                return;
            }
            var dueIntervals = scheduledRecordsDue.filter(function (_a) {
                var type = _a.type;
                return type === 'interval';
            });
            if (dueIntervals.length > 0) {
                var firstDueInterval = dueIntervals[0];
                var duration = firstDueInterval.duration, handler = firstDueInterval.handler;
                firstDueInterval.due = now + duration;
                firstDueInterval.subscription = _this.schedule(run, duration);
                handler();
                return;
            }
            var dueTimeouts = scheduledRecordsDue.filter(function (_a) {
                var type = _a.type;
                return type === 'timeout';
            });
            if (dueTimeouts.length > 0) {
                var _b = dueTimeouts[0], handle = _b.handle, handler = _b.handler;
                scheduleLookup.delete(handle);
                handler();
                return;
            }
            throw new Error('Expected a due immediate or interval');
        };
        var immediate = {
            setImmediate: function (handler) {
                var handle = ++lastHandle;
                scheduleLookup.set(handle, {
                    due: _this.now(),
                    duration: 0,
                    handle: handle,
                    handler: handler,
                    subscription: _this.schedule(run, 0),
                    type: 'immediate',
                });
                return handle;
            },
            clearImmediate: function (handle) {
                var value = scheduleLookup.get(handle);
                if (value) {
                    value.subscription.unsubscribe();
                    scheduleLookup.delete(handle);
                }
            },
        };
        var interval = {
            setInterval: function (handler, duration) {
                if (duration === void 0) { duration = 0; }
                var handle = ++lastHandle;
                scheduleLookup.set(handle, {
                    due: _this.now() + duration,
                    duration: duration,
                    handle: handle,
                    handler: handler,
                    subscription: _this.schedule(run, duration),
                    type: 'interval',
                });
                return handle;
            },
            clearInterval: function (handle) {
                var value = scheduleLookup.get(handle);
                if (value) {
                    value.subscription.unsubscribe();
                    scheduleLookup.delete(handle);
                }
            },
        };
        var timeout = {
            setTimeout: function (handler, duration) {
                if (duration === void 0) { duration = 0; }
                var handle = ++lastHandle;
                scheduleLookup.set(handle, {
                    due: _this.now() + duration,
                    duration: duration,
                    handle: handle,
                    handler: handler,
                    subscription: _this.schedule(run, duration),
                    type: 'timeout',
                });
                return handle;
            },
            clearTimeout: function (handle) {
                var value = scheduleLookup.get(handle);
                if (value) {
                    value.subscription.unsubscribe();
                    scheduleLookup.delete(handle);
                }
            },
        };
        return { immediate: immediate, interval: interval, timeout: timeout };
    };
    TestScheduler.prototype.run = function (callback) {
        var prevFrameTimeFactor = TestScheduler.frameTimeFactor;
        var prevMaxFrames = this.maxFrames;
        TestScheduler.frameTimeFactor = 1;
        this.maxFrames = Infinity;
        this.runMode = true;
        var animator = this.createAnimator();
        var delegates = this.createDelegates();
        animationFrameProvider.delegate = animator.delegate;
        dateTimestampProvider.delegate = this;
        immediateProvider.delegate = delegates.immediate;
        intervalProvider.delegate = delegates.interval;
        timeoutProvider.delegate = delegates.timeout;
        performanceTimestampProvider.delegate = this;
        var helpers = {
            cold: this.createColdObservable.bind(this),
            hot: this.createHotObservable.bind(this),
            flush: this.flush.bind(this),
            time: this.createTime.bind(this),
            expectObservable: this.expectObservable.bind(this),
            expectSubscriptions: this.expectSubscriptions.bind(this),
            animate: animator.animate,
        };
        try {
            var ret = callback(helpers);
            this.flush();
            return ret;
        }
        finally {
            TestScheduler.frameTimeFactor = prevFrameTimeFactor;
            this.maxFrames = prevMaxFrames;
            this.runMode = false;
            animationFrameProvider.delegate = undefined;
            dateTimestampProvider.delegate = undefined;
            immediateProvider.delegate = undefined;
            intervalProvider.delegate = undefined;
            timeoutProvider.delegate = undefined;
            performanceTimestampProvider.delegate = undefined;
        }
    };
    TestScheduler.frameTimeFactor = 10;
    return TestScheduler;
}(VirtualTimeScheduler));
export { TestScheduler };
//# sourceMappingURL=TestScheduler.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       {
  "Commands:": "–ö–æ–º–∞–Ω–¥–∏:",
  "Options:": "–û–ø—Ü—ñ—ó:",
  "Examples:": "–ü—Ä–∏–∫–ª–∞–¥–∏:",
  "boolean": "boolean",
  "count": "–∫—ñ–ª—å–∫—ñ—Å—Ç—å",
  "string": "—Å—Ç—Ä–æ–∫–∞",
  "number": "—á–∏—Å–ª–æ",
  "array": "–º–∞—Å–∏–≤–∞",
  "required": "–æ–±–æ–≤'—è–∑–∫–æ–≤–æ",
  "default": "–∑–∞ –∑–∞–º–æ–≤—á—É–≤–∞–Ω–Ω—è–º",
  "default:": "–∑–∞ –∑–∞–º–æ–≤—á—É–≤–∞–Ω–Ω—è–º:",
  "choices:": "–¥–æ—Å—Ç—É–ø–Ω—ñ –≤–∞—Ä—ñ–∞–Ω—Ç–∏:",
  "aliases:": "–ø—Å–µ–≤–¥–æ–Ω—ñ–º–∏:",
  "generated-value": "–∑–≥–µ–Ω–µ—Ä–æ–≤–∞–Ω–µ –∑–Ω–∞—á–µ–Ω–Ω—è",
  "Not enough non-option arguments: got %s, need at least %s": {
    "one": "–ù–µ–¥–æ—Å—Ç–∞—Ç–Ω—å–æ –∞—Ä–≥—É–º–µ–Ω—Ç—ñ–≤: –Ω–∞—Ä–∞–∑—ñ %s, –ø–æ—Ç—Ä—ñ–±–Ω–æ %s –∞–±–æ –±—ñ–ª—å—à–µ",
    "other": "–ù–µ–¥–æ—Å—Ç–∞—Ç–Ω—å–æ –∞—Ä–≥—É–º–µ–Ω—Ç—ñ–≤: –Ω–∞—Ä–∞–∑—ñ %s, –ø–æ—Ç—Ä—ñ–±–Ω–æ %s –∞–±–æ –±—ñ–ª—å—à–µ"
  },
  "Too many non-option arguments: got %s, maximum of %s": {
    "one": "–ó–∞–±–∞–≥–∞—Ç–æ –∞—Ä–≥—É–º–µ–Ω—Ç—ñ–≤: –Ω–∞—Ä–∞–∑—ñ %s, –º–∞–∫—Å–∏–º—É–º %s",
    "other": "Too many non-option arguments: –Ω–∞—Ä–∞–∑—ñ %s, –º–∞–∫—Å–∏–º—É–º of %s"
  },
  "Missing argument value: %s": {
    "one": "–í—ñ–¥—Å—É—Ç–Ω—î –∑–Ω–∞—á–µ–Ω–Ω—è –¥–ª—è –∞—Ä–≥—É–º–µ–Ω—Ç—É: %s",
    "other": "–í—ñ–¥—Å—É—Ç–Ω—ñ –∑–Ω–∞—á–µ–Ω–Ω—è –¥–ª—è –∞—Ä–≥—É–º–µ–Ω—Ç—É: %s"
  },
  "Missing required argument: %s": {
    "one": "–í—ñ–¥—Å—É—Ç–Ω—ñ–π –æ–±–æ–≤'—è–∑–∫–æ–≤–∏–π –∞—Ä–≥—É–º–µ–Ω—Ç: %s",
    "other": "–í—ñ–¥—Å—É—Ç–Ω—ñ –æ–±–æ–≤'—è–∑–∫–æ–≤—ñ –∞—Ä–≥—É–º–µ–Ω—Ç–∏: %s"
  },
  "Unknown argument: %s": {
    "one": "–ê—Ä–≥—É–º–µ–Ω—Ç %s –Ω–µ –ø—ñ–¥—Ç—Ä–∏–º—É—î—Ç—å—Å—è",
    "other": "–ê—Ä–≥—É–º–µ–Ω—Ç–∏ %s –Ω–µ –ø—ñ–¥—Ç—Ä–∏–º—É—é—Ç—å—Å—è"
  },
  "Invalid values:": "–ù–µ–∫–æ—Ä–µ–∫—Ç–Ω—ñ –∑–Ω–∞—á–µ–Ω–Ω—è:",
  "Argument: %s, G                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           import { innerFrom } from '../observable/innerFrom';
import { Subject } from '../Subject';
import { SafeSubscriber } from '../Subscriber';
import { operate } from '../util/lift';
export function share(options = {}) {
    const { connector = () => new Subject(), resetOnError = true, resetOnComplete = true, resetOnRefCountZero = true } = options;
    return (wrapperSource) => {
        let connection;
        let resetConnection;
        let subject;
        let refCount = 0;
        let hasCompleted = false;
        let hasErrored = false;
        const cancelReset = () => {
            resetConnection === null || resetConnection === void 0 ? void 0 : resetConnection.unsubscribe();
            resetConnection = undefined;
        };
        const reset = () => {
            cancelReset();
            connection = subject = undefined;
            hasCompleted = hasErrored = false;
        };
        const resetAndUnsubscribe = () => {
            const conn = connection;
            reset();
            conn === null || conn === void 0 ? void 0 : conn.unsubscribe();
        };
        return operate((source, subscriber) => {
            refCount++;
            if (!hasErrored && !hasCompleted) {
                cancelReset();
            }
            const dest = (subject = subject !== null && subject !== void 0 ? subject : connector());
            subscriber.add(() => {
                refCount--;
                if (refCount === 0 && !hasErrored && !hasCompleted) {
                    resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero);
                }
            });
            dest.subscribe(subscriber);
            if (!connection &&
                refCount > 0) {
                connection = new SafeSubscriber({
                    next: (value) => dest.next(value),
                    error: (err) => {
                        hasErrored = true;
                        cancelReset();
                        resetConnection = handleReset(reset, resetOnError, err);
                        dest.error(err);
                    },
                    complete: () => {
                        hasCompleted = true;
                        cancelReset();
                        resetConnection = handleReset(reset, resetOnComplete);
                        dest.complete();
                    },
                });
                innerFrom(source).subscribe(connection);
            }
        })(wrapperSource);
    };
}
function handleReset(reset, on, ...args) {
    if (on === true) {
        reset();
        return;
    }
    if (on === false) {
        return;
    }
    const onSubscriber = new SafeSubscriber({
        next: () => {
            onSubscriber.unsubscribe();
            reset();
        },
    });
    return innerFrom(on(...args)).subscribe(onSubscriber);
}
//# sourceMappingURL=share.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   import { EmptyError } from '../util/EmptyError';
import { SequenceError } from '../util/SequenceError';
import { NotFoundError } from '../util/NotFoundError';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
export function single(predicate) {
    return operate(function (source, subscriber) {
        var hasValue = false;
        var singleValue;
        var seenValue = false;
        var index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            seenValue = true;
            if (!predicate || predicate(value, index++, source)) {
                hasValue && subscriber.error(new SequenceError('Too many matching values'));
                hasValue = true;
                singleValue = value;
            }
        }, function () {
            if (hasValue) {
                subscriber.next(singleValue);
                subscriber.complete();
            }
            else {
                subscriber.error(seenValue ? new NotFoundError('No matching values') : new EmptyError());
            }
        }));
    });
}
//# sourceMappingURL=single.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     	‹8Êô˘—´‚Àõî∏Ç˘í_hfõÌZA1#!dr‰9ë ìÓƒÿm‰O<6}:U˚¥Ëf≥u Sö**à˝”ŸZ„R<~x ¨Ò°I©z‚0‹˙£« %]Ì:Á70á~l\∆·r<Ôç}˘ÁúñÛo—ÌvfÏ3´iPò&U⁄m01bW§[ÙqRS.é°¨êÜáã/ﬁ∆Ö8®ÕﬂpvÖá|œXTTf…Ír≥X.ï;;ë´MxÙ@ë"Ω{∑;È·bÂ£ÍÒ≠j‚@®kƒÔ+x:m˛Gi¿Tu-™V∏ﬂhUÔÙ‡cU(Â∂Pø|îπ&<N5	Â\∫zx" «™’3OÚõ∂R@„‰g≥¶Øénz·ôóK2v7˙mò}5©#âF∞0§õcÅI◊ÒL’ÖΩJtIDUD•4„DyG‘´3√%7˜W˘¢…l˘%àe 1SB…DÈı3Õu<ì≈H’V?ñÙ˘ˇ√Á=TQQWπ—Õ3“SıÁ=Õ-N]NH˜§›∑∞ñ¢m ß®ΩG«#]’Œ+ˆ(sHôˆ4EtçmüïˇïÍÈ‹Ÿπ:üÎp	∫ﬁ˙ıFF-FY≤ëÜ$≥ÊlkluJXÎ>æ4€G˛…ÂZT©ì®Â\⁄≤ÌÛTæñ√˝BÙèÈ#"€vÒUÇ¬7¶a’õ^Ö¥
>ã©0∆–‡ àLhÒ‹Ê &à©Ã˚ŒôBb∑“6zKÙAíô–»Ó\RôºÖ≥2òË#ﬂc2ÌÈıÁÖ.X~q,$"pÖ;èA ä§[ñYØÚvVﬁ≈›’g{r≠/Ô]È¶É≥ëÓ(PÊ∆í+e!^±¥∆<≈ÜÌ›Á¥≥%/ÏIÇˇ©>i0§p˝ƒnÆYœ,ﬁcÛ*Aä:ÚésIøÊY2<"ºLâ‰ıkÙÚ$P=X≠w6áHWƒÃ˚ö$æäG‰ôí≈©”{´ˆàã‰á ^∏ÿ˘VZtπZÙ´˚ù8¶wﬁöﬂ-7!Ì˛≥^NŒ‚ì,›Î/u◊PÆÉi¥Ç˙oõÑ—*Èz[7>ßˆ◊5º¸^:ﬂ
YPx9≤wM+äîÄ{Û√’ˇ˝Èüÿæ$'ê¯†»Ä4∫e~o…Âîå˜!Æ=¥ûhLíÉô#†Îutã∑J-SﬁîÏ‰ÜYè◊*÷◊/ÿ'‚såµd=:Ò˚≥"ÃP… 
£XÖM‡ëD^ï€˙Ös◊ô,=èå9;ÌôÉÁÍ,u}Ø|¨Ÿ$–ök∫3»Ù™›5f=ö’R‚Wlö∂c\Cﬁå}dwIÓírﬁ"(N
¥“îoÈ¸„"Õƒ^¨ ú¡Q#AŒΩ68ùWæˇå-Àd˙·O∂Ü9N Çˆix,Hé˙QPy˜¬Ú®rØb~Lè`Ú.ûCÌaˆùœmH7πº¨ d4ì°‘'{xYàäyfzK`É‘n√z\≠<™Bã[s”Wqÿÿ:/≠Á˛◊æ´†3ô≈%$Á§ì∂Q ˙8ö3r˙+à$$Õzf´Ÿ009@wô†©œØW≈ÔûŸÌ# E*Åãì?Qú]ôÒü´™ÿ∑Û•˜T¨^Ç¥S∫‡‘y»ÁVî¯˜@T√Åﬂ·‹	ö√	Ób©:e |î.æx3ùÖ¨>jˆ’ Åˆ >ﬂ}:◊ÊB¸hÈ$S∏3,d‘ÊÂƒ˘WøÕÄÓ>:π[“ÌkòªBˆ`B} ª!™'ÓnóŸ(Ü'úVπN>Òœanﬂœ¬”¥òî’3D¨wÛ_®4‚äêß<#VÉKö"˚Q’µfB†f∏¸≈÷ìV»Ñ’∫ı√À—tù^=˛o™Å”ËÉÌÌX≠¡íìsøÑ[Ì$7wvä≥:—/Rƒ©aÔa∞ÿb|ÍºV∏?tﬂ;ø’LVâãn7©é?Ω˝Â◊g˛854ÂàÖÀn«Fû˙sqÈ–®‰“?¡1=ﬂÄdeBÔÂËn™,àóÙ gIé›Å¨Y«i¯©Vü¢M6ãËÑ)Œä2πb¥OπÕ◊?(åw‚˛∞vdSıÇÄbªë$@ûFÏ

Á¨anLuô°îÒ‰n—vÕÅ5”◊∂»zã"˙Ïmokò)O‹qL’}_ÙÇW<ª5Ú@˚~M NyﬁïR÷,“3ëÏﬁÿ≠›≈Ü¨”…sËÁØ0`4#±◊(›Âw7C™™—P∫`®Ã.}ˆFü¸œÆbíOÅHJÊ∑Óq§àgìKÄszÓmˇLﬂ{6íC‡)πµ*™6Ä.ﬁ+ûQEÓ/ÿ“f—R)†Í–ÖóxJ©Ãcqpº•¥bπÎC„‹∞ô⁄√±vØNõ]cF£i√◊lã∫Ÿø† Tl¿π,’•!IŒœ¿/‰§ı]&ŒÆ¶I«Qß)á\oéN¸Sm=ûà˘”¬£ª©ìgKçÄÏùææù(	%(”q¢ãAÔ’5ÚPd/_˛$;3—»πã\°Ù∫ÇGrÓêË¨2æG6ºDﬂª2Ï:¬µN;…R|ÔqÿÕÇÖŸô0åvs§czΩöπ√>∑Zo˜„>ö’∂≥~L[>Kã	üß±0C“¢™Qàvk%é4LD·"q˚Cè.“ä~HJ<ızè£6ës3_Lèﬁæê≥&ICËü®¶±ƒ˛"º*aîÿBïtà“ê@´π◊»Å¯Ó-˘|ûhÃ_‡ 'RπÜ˙%‘.[Â¥á§£ã§^ØñºÚñ˝s¥ <MÚ{4 ·B&LfEùGµíT€6˚UG*∆=€ÔØΩ‘`>¸îıŒb◊€bÚÈ´lü	A˚cáﬁ“&”d °L‘ â˙“˜y‚4é ˝
å≥å™ã%Øéıäàï˚àµﬂY3xò¢iª8≠é“√
*éãéúcß°&∏ﬁªƒys\gÖ∞4O‘Åy‡ùûÃHÁ¢—:ä}§©∫⁄nîUd√ıvº=≤ƒ—qéæﬂÒ©â∏C™%Úäs)àÎ=•ÉÕ°Âì¶J¥ÌÍîπÿBX˛‰ày±eì ËÊ±∑ÑH†OxÏSJÆÎæ∆¿ÍV±3SÉoÒáı†@!ÇëôÔ≠∏S^†gDÍÉ9âE¬ˆh∫˙E+©Ü∞3R´©ãj≤-∑=GMLÍæ€7’ôñf`ﬂRzÛõ«ó∫C)>€Ahñ™™z25S{›*5o]ÿ¨ﬂßx°»ÇÓlÀKnêò!lÔïÔLë|à£™˝ÅiºªQÿ#Dõã°ö[HÈ‚ÉUX<àµ¡Ü3&<éïq≈‘±OÑ1Oëz˙æ1jUfHç¨cˇÆ∫ufTQqsÑ„˙ÏœñéÔˆ˙õß-¸Ã:ÿ§Ãhác°ë#üü∞ÿ;*<6-6á=ˆ?;	˛a]!‰òa‰5ª¸âfî_'≤Õ$õ´St¡]ñ=2∆OµRPàüóJ˝oo´wùÇØ$RTπ?ÑW˝Ìˆ[,é≈øÙëìØ¨h˘Pﬁ&Îû¡¡è≤∞Î«Äj–‚∫v/y@™π«Ù•P&·€y6XY∫'9?'•Ã ¶0úR…¬ˇHB9ÁÇå¡.e›˜YﬁoÎÈÔﬂñÍ≈)?ç.¿[)û∞œ≥"v7›Õ|Y◊ù˜‹à¥<óX9œ--	ƒO#‡ÁıeÇÂ:†jy`≠˙w’’LQ*ÏßC`Õ@Jëj`ƒ.Û¿@®bƒV–óÃ¨Æ/¡!§É≈ ¶±¥$¡7 f¯;ÖAır¨©xe	}Å´Àï†ï0Ô˛füv0–ªÚ/ÑŒ”K=kN®0Ã‡∂d,6Í¨À@·u–ëóì8yUΩ,ôøvåN€1êîèäºûÛ‹©›yÛTÏuß§ı∑±Ã¥∞/!)ﬂ›wN0U'˘ôÊç∂qrîÈã6ÀÇÿ±P¶Æú\ı÷›]6
é¡	˛‚éÏ¸ıÑ_2ZÁÃ#’üÃAÍex?2$¥`üè"§≥>O¶f¢õ9ı6ñgW#,bÂN–X‰ó;πù¶ràZ,Á≠ês›iÌrê÷m“0§¯◊Ãîj∫ö¿ñH_ïá≥1Ö¡,
FY’ÄÏcJˆ¬;ﬂt‹ŸxffrÈí∫’#˜•ÌK<DüåeeªùKã"fmÇí]¥	éœb≥†‚a¨ø”¡÷%J ™7ò>™CﬁoÖò‡ﬂ€pI≈á5r¶X/ë˜í∫õ&ùN¡(à{˙Öù/⁄OyÛHyÅgÖJÊ°ªI†–l6îVœõÉ¥q´ πﬂx–{åñQxÊpJÑ/±UÉHÇ!œ<P™XN˘ÑXÊ–∞∏m$Zn¯6]ç˛4u‚Æs&£˛w	¡Ã¨À´2mæ∂¥o'¥˜ÉÖ
à◊w[\zM‡›¬C$ÁT[Y∫…ä@øo@Ój+SWÜ±L‡ß H	ô≤–⁄Ù4Üˆ¢ÿˆ©õh6ÖòW‡ôkëPî”æ?ÁÉ#±N °Üûâ{˘0÷ôa÷¯Ã™1{ÒÀÔlß3“√∞k√57`ó‰6( ∏+⁄ÊÍ ‰ê`≤,ﬁ\{Õ#YU√ÛHü"IJ ¥‹†x £ËEË\õrñáeKùÛQ%újùÊL{‘¨ñBzkéßÃu“"S3àµÉâÛÎxOÏvÊª‹}Vyb´Ö¢í¥±ÄÚBM‡}≤q9¿UnkE˚/˜YI ™	@÷È“aA<^‘≈[˜≠ÍΩBºÅ]E"∞ÒB&öQ⁄’•òÛÿ‰∫"„H3…;Ã(≤^hê,Î*E®ﬁ◊srñû´ yM≥¬Â√5·Õ#QÜ[(´0§wÛﬂøÏd±sµ≠}öª]≈-û˚¿µû˚ÜYpægÏ9	¢J €c˘‘jûJìv{≈ô)FGm4"ñM·z æ¯oÅPêÔx([XrØ√Ô˜zOd’…©FÈ•| vÖ≠ôøœâÃ&ï¿É˛}˝áYF-Ïﬂê±™ ÛÆK…Ô©Ì¢b?3·ﬂe⁄ï˛¬BDwøÿ·\«ù{Ã‡‘¿◊+ˇŸ≈G®KÀëﬂeÉìæ}ÛCs¯^H|·Ìº¥/N(ÄÎ$»≈¨†•í
Á“4Ÿ¢ÔàYy—õˇﬁ]∆XV5@5À˛≤¿Eì µh* ò€‘„©Ó¶ è;ŸháMı‡LwÌı|®á$A◊uãM%*#ü R÷±◊ˇQ DΩüé£‡¸ˆ˜ÇèE?~mDQπä`∞ÚL'Ã4FQ3T˙u]Ì⁄teì"™ˇ—KHÜÃ‡.Ì‹òæ yI^@a>œÉ√“„Zﬂﬁ{É4∫Vºà4LÉº=§}€ÁT—ÿ$1#äpfU≈ˇ@YıõºÁeó´,øòåæò$blY¨òs"ıp◊b…—ECÛÿ!5aò-Îf–DVÏêó	~@à¡‘∆&´Hgˇ≠â'STCÄ£ıãÂÀ¶_C¨ê˛9QPìjF‰uñÎ.±Â‘4Dﬂ7ã——Y[BÁh `a…eÎ◊0ÃŸk1E4È ∏•®YçÇ∫Ôd˛Ì7i5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceEqual = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
function sequenceEqual(compareTo, comparator) {
    if (comparator === void 0) { comparator = function (a, b) { return a === b; }; }
    return lift_1.operate(function (source, subscriber) {
        var aState = createState();
        var bState = createState();
        var emit = function (isEqual) {
            subscriber.next(isEqual);
            subscriber.complete();
        };
        var createSubscriber = function (selfState, otherState) {
            var sequenceEqualSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (a) {
                var buffer = otherState.buffer, complete = otherState.complete;
                if (buffer.length === 0) {
                    complete ? emit(false) : selfState.buffer.push(a);
                }
                else {
                    !comparator(a, buffer.shift()) && emit(false);
                }
            }, function () {
                selfState.complete = true;
                var complete = otherState.complete, buffer = otherState.buffer;
                complete && emit(buffer.length === 0);
                sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
            });
            return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        innerFrom_1.innerFrom(compareTo).subscribe(createSubscriber(bState, aState));
    });
}
exports.sequenceEqual = sequenceEqual;
function createState() {
    return {
        buffer: [],
        complete: false,
    };
}
//# sourceMappingURL=sequenceEqual.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';
export function throttle(durationSelector, config) {
    return operate((source, subscriber) => {
        const { leading = true, trailing = false } = config !== null && config !== void 0 ? config : {};
        let hasValue = false;
        let sendValue = null;
        let throttled = null;
        let isComplete = false;
        const endThrottling = () => {
            throttled === null || throttled === void 0 ? void 0 : throttled.unsubscribe();
            throttled = null;
            if (trailing) {
                send();
                isComplete && subscriber.complete();
            }
        };
        const cleanupThrottling = () => {
            throttled = null;
            isComplete && subscriber.complete();
        };
        const startThrottle = (value) => (throttled = innerFrom(durationSelector(value)).subscribe(createOperatorSubscriber(subscriber, endThrottling, cleanupThrottling)));
        const send = () => {
            if (hasValue) {
                hasValue = false;
                const value = sendValue;
                sendValue = null;
                subscriber.next(value);
                !isComplete && startThrottle(value);
            }
        };
        source.subscribe(createOperatorSubscriber(subscriber, (value) => {
            hasValue = true;
            sendValue = value;
            !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
        }, () => {
            isComplete = true;
            !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=throttle.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';
import { noop } from '../util/noop';
export function skipUntil(notifier) {
    return operate(function (source, subscriber) {
        var taking = false;
        var skipSubscriber = createOperatorSubscriber(subscriber, function () {
            skipSubscriber === null || skipSubscriber === void 0 ? void 0 : skipSubscriber.unsubscribe();
            taking = true;
        }, noop);
        innerFrom(notifier).subscribe(skipSubscriber);
        source.subscribe(createOperatorSubscriber(subscriber, function (value) { return taking && subscriber.next(value); }));
    });
}
//# sourceMappingURL=skipUntil.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceEqual = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
function sequenceEqual(compareTo, comparator) {
    if (comparator === void 0) { comparator = function (a, b) { return a === b; }; }
    return lift_1.operate(function (source, subscriber) {
        var aState = createState();
        var bState = createState();
        var emit = function (isEqual) {
            subscriber.next(isEqual);
            subscriber.complete();
        };
        var createSubscriber = function (selfState, otherState) {
            var sequenceEqualSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (a) {
                var buffer = otherState.buffer, complete = otherState.complete;
                if (buffer.length === 0) {
                    complete ? emit(false) : selfState.buffer.push(a);
                }
                else {
                    !comparator(a, buffer.shift()) && emit(false);
                }
            }, function () {
                selfState.complete = true;
                var complete = otherState.complete, buffer = otherState.buffer;
                complete && emit(buffer.length === 0);
                sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
            });
            return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        innerFrom_1.innerFrom(compareTo).subscribe(createSubscriber(bState, aState));
    });
}
exports.sequenceEqual = sequenceEqual;
function createState() {
    return {
        buffer: [],
        complete: false,
    };
}
//# sourceMappingURL=sequenceEqual.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipUntil = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
var noop_1 = require("../util/noop");
function skipUntil(notifier) {
    return lift_1.operate(function (source, subscriber) {
        var taking = false;
        var skipSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
            skipSubscriber === null || skipSubscriber === void 0 ? void 0 : skipSubscriber.unsubscribe();
            taking = true;
        }, noop_1.noop);
        innerFrom_1.innerFrom(notifier).subscribe(skipSubscriber);
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) { return taking && subscriber.next(value); }));
    });
}
exports.skipUntil = skipUntil;
//# sourceMappingURL=skipUntil.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceEqual = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
function sequenceEqual(compareTo, comparator) {
    if (comparator === void 0) { comparator = function (a, b) { return a === b; }; }
    return lift_1.operate(function (source, subscriber) {
        var aState = createState();
        var bState = createState();
        var emit = function (isEqual) {
            subscriber.next(isEqual);
            subscriber.complete();
        };
        var createSubscriber = function (selfState, otherState) {
            var sequenceEqualSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (a) {
                var buffer = otherState.buffer, complete = otherState.complete;
                if (buffer.length === 0) {
                    complete ? emit(false) : selfState.buffer.push(a);
                }
                else {
                    !comparator(a, buffer.shift()) && emit(false);
                }
            }, function () {
                selfState.complete = true;
                var complete = otherState.complete, buffer = otherState.buffer;
                complete && emit(buffer.length === 0);
                sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
            });
            return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        innerFrom_1.innerFrom(compareTo).subscribe(createSubscriber(bState, aState));
    });
}
exports.sequenceEqual = sequenceEqual;
function createState() {
    return {
        buffer: [],
        complete: false,
    };
}
//# sourceMappingURL=sequenceEqual.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            import { identity } from '../util/identity';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
export function skipLast(skipCount) {
    return skipCount <= 0
        ?
            identity
        : operate(function (source, subscriber) {
            var ring = new Array(skipCount);
            var seen = 0;
            source.subscribe(createOperatorSubscriber(subscriber, function (value) {
                var valueIndex = seen++;
                if (valueIndex < skipCount) {
                    ring[valueIndex] = value;
                }
                else {
                    var index = valueIndex % skipCount;
                    var oldValue = ring[index];
                    ring[index] = value;
                    subscriber.next(oldValue);
                }
            }));
            return function () {
                ring = null;
            };
        });
}
//# sourceMappingURL=skipLast.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             import { identity } from '../util/identity';
import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
export function skipLast(skipCount) {
    return skipCount <= 0
        ?
            identity
        : operate((source, subscriber) => {
            let ring = new Array(skipCount);
            let seen = 0;
            source.subscribe(createOperatorSubscriber(subscriber, (value) => {
                const valueIndex = seen++;
                if (valueIndex < skipCount) {
                    ring[valueIndex] = value;
                }
                else {
                    const index = valueIndex % skipCount;
                    const oldValue = ring[index];
                    ring[index] = value;
                    subscriber.next(oldValue);
                }
            }));
            return () => {
                ring = null;
            };
        });
}
//# sourceMappingURL=skipLast.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';
export function sequenceEqual(compareTo, comparator = (a, b) => a === b) {
    return operate((source, subscriber) => {
        const aState = createState();
        const bState = createState();
        const emit = (isEqual) => {
            subscriber.next(isEqual);
            subscriber.complete();
        };
        const createSubscriber = (selfState, otherState) => {
            const sequenceEqualSubscriber = createOperatorSubscriber(subscriber, (a) => {
                const { buffer, complete } = otherState;
                if (buffer.length === 0) {
                    complete ? emit(false) : selfState.buffer.push(a);
                }
                else {
                    !comparator(a, buffer.shift()) && emit(false);
                }
            }, () => {
                selfState.complete = true;
                const { complete, buffer } = otherState;
                complete && emit(buffer.length === 0);
                sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
            });
            return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        innerFrom(compareTo).subscribe(createSubscriber(bState, aState));
    });
}
function createState() {
    return {
        buffer: [],
        complete: false,
    };
}
//# sourceMappingURL=sequenceEqual.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              import { __read, __spreadArray } from "tslib";
import { innerFrom } from '../observable/innerFrom';
import { Subject } from '../Subject';
import { SafeSubscriber } from '../Subscriber';
import { operate } from '../util/lift';
export function share(options) {
    if (options === void 0) { options = {}; }
    var _a = options.connector, connector = _a === void 0 ? function () { return new Subject(); } : _a, _b = options.resetOnError, resetOnError = _b === void 0 ? true : _b, _c = options.resetOnComplete, resetOnComplete = _c === void 0 ? true : _c, _d = options.resetOnRefCountZero, resetOnRefCountZero = _d === void 0 ? true : _d;
    return function (wrapperSource) {
        var connection;
        var resetConnection;
        var subject;
        var refCount = 0;
        var hasCompleted = false;
        var hasErrored = false;
        var cancelReset = function () {
            resetConnection === null || resetConnection === void 0 ? void 0 : resetConnection.unsubscribe();
            resetConnection = undefined;
        };
        var reset = function () {
            cancelReset();
            connection = subject = undefined;
            hasCompleted = hasErrored = false;
        };
        var resetAndUnsubscribe = function () {
            var conn = connection;
            reset();
            conn === null || conn === void 0 ? void 0 : conn.unsubscribe();
        };
        return operate(function (source, subscriber) {
            refCount++;
            if (!hasErrored && !hasCompleted) {
                cancelReset();
            }
            var dest = (subject = subject !== null && subject !== void 0 ? subject : connector());
            subscriber.add(function () {
                refCount--;
                if (refCount === 0 && !hasErrored && !hasCompleted) {
                    resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero);
                }
            });
            dest.subscribe(subscriber);
            if (!connection &&
                refCount > 0) {
                connection = new SafeSubscriber({
                    next: function (value) { return dest.next(value); },
                    error: function (err) {
                        hasErrored = true;
                        cancelReset();
                        resetConnection = handleReset(reset, resetOnError, err);
                        dest.error(err);
                    },
                    complete: function () {
                        hasCompleted = true;
                        cancelReset();
                        resetConnection = handleReset(reset, resetOnComplete);
                        dest.complete();
                    },
                });
                innerFrom(source).subscribe(connection);
            }
        })(wrapperSource);
    };
}
function handleReset(reset, on) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (on === true) {
        reset();
        return;
    }
    if (on === false) {
        return;
    }
    var onSubscriber = new SafeSubscriber({
        next: function () {
            onSubscriber.unsubscribe();
            reset();
        },
    });
    return innerFrom(on.apply(void 0, __spreadArray([], __read(args)))).subscribe(onSubscriber);
}
//# sourceMappingURL=share.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';
export function sequenceEqual(compareTo, comparator = (a, b) => a === b) {
    return operate((source, subscriber) => {
        const aState = createState();
        const bState = createState();
        const emit = (isEqual) => {
            subscriber.next(isEqual);
            subscriber.complete();
        };
        const createSubscriber = (selfState, otherState) => {
            const sequenceEqualSubscriber = createOperatorSubscriber(subscriber, (a) => {
                const { buffer, complete } = otherState;
                if (buffer.length === 0) {
                    complete ? emit(false) : selfState.buffer.push(a);
                }
                else {
                    !comparator(a, buffer.shift()) && emit(false);
                }
            }, () => {
                selfState.complete = true;
                const { complete, buffer } = otherState;
                complete && emit(buffer.length === 0);
                sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
            });
            return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        innerFrom(compareTo).subscribe(createSubscriber(bState, aState));
    });
}
function createState() {
    return {
        buffer: [],
        complete: false,
    };
}
//# sourceMappingURL=sequenceEqual.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipLast = void 0;
var identity_1 = require("../util/identity");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function skipLast(skipCount) {
    return skipCount <= 0
        ?
            identity_1.identity
        : lift_1.operate(function (source, subscriber) {
            var ring = new Array(skipCount);
            var seen = 0;
            source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                var valueIndex = seen++;
                if (valueIndex < skipCount) {
                    ring[valueIndex] = value;
                }
                else {
                    var index = valueIndex % skipCount;
                    var oldValue = ring[index];
                    ring[index] = value;
                    subscriber.next(oldValue);
                }
            }));
            return function () {
                ring = null;
            };
        });
}
exports.skipLast = skipLast;
//# sourceMappingURL=skipLast.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              import { operate } from '../util/lift';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { innerFrom } from '../observable/innerFrom';
export function throttle(durationSelector, config) {
    return operate(function (source, subscriber) {
        var _a = config !== null && config !== void 0 ? config : {}, _b = _a.leading, leading = _b === void 0 ? true : _b, _c = _a.trailing, trailing = _c === void 0 ? false : _c;
        var hasValue = false;
        var sendValue = null;
        var throttled = null;
        var isComplete = false;
        var endThrottling = function () {
            throttled === null || throttled === void 0 ? void 0 : throttled.unsubscribe();
            throttled = null;
            if (trailing) {
                send();
                isComplete && subscriber.complete();
            }
        };
        var cleanupThrottling = function () {
            throttled = null;
            isComplete && subscriber.complete();
        };
        var startThrottle = function (value) {
            return (throttled = innerFrom(durationSelector(value)).subscribe(createOperatorSubscriber(subscriber, endThrottling, cleanupThrottling)));
        };
        var send = function () {
            if (hasValue) {
                hasValue = false;
                var value = sendValue;
                sendValue = null;
                subscriber.next(value);
                !isComplete && startThrottle(value);
            }
        };
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            sendValue = value;
            !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
        }, function () {
            isComplete = true;
            !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=throttle.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ode.
            file_node = next(iter(dependency_nodes.values()))
            file_node.dependencies.append(root_node)
            root_node.dependents.append(file_node)
        cycles = []
        for cycle in root_node.FindCycles():
            paths = [node.ref for node in cycle]
            cycles.append("Cycle: %s" % " -> ".join(paths))
        raise DependencyGraphNode.CircularException(
            "Cycles in .gyp file dependency graph detected:\n" + "\n".join(cycles)
        )


def DoDependentSettings(key, flat_list, targets, dependency_nodes):
    # key should be one of all_dependent_settings, direct_dependent_settings,
    # or link_settings.

    for target in flat_list:
        target_dict = targets[target]
        build_file = gyp.common.BuildFile(target)

        if key == "all_dependent_settings":
            dependencies = dependency_nodes[target].DeepDependencies()
        elif key == "direct_dependent_settings":
            dependencies = dependency_nodes[target].DirectAndImportedDependencies(
                targets
            )
        elif key == "link_settings":
            dependencies = dependency_nodes[target].DependenciesForLinkSettings(targets)
        else:
            raise GypError(
                "DoDependentSettings doesn't know how to determine "
                "dependencies for " + key
            )

        for dependency in dependencies:
            dependency_dict = targets[dependency]
            if key not in dependency_dict:
                continue
            dependency_build_file = gyp.common.BuildFile(dependency)
            MergeDicts(
                target_dict, dependency_dict[key], build_file, dependency_build_file
            )


def AdjustStaticLibraryDependencies(
    flat_list, targets, dependency_nodes, sort_dependencies
):
    # Recompute target "dependencies" properties.  For each static library
    # target, remove "dependencies" entries referring to other static libraries,
    # unless the dependency has the "hard_dependency" attribute set.  For each
    # linkable target, add a "dependencies" entry referring to all of the
    # target's computed list of link dependencies (including static libraries
    # if no such entry is already present.
    for target in flat_list:
        target_dict = targets[target]
        target_type = target_dict["type"]

        if target_type == "static_library":
            if "dependencies" not in target_dict:
                continue

            target_dict["dependencies_original"] = target_dict.get("dependencies", [])[
                :
            ]

            # A static library shoul                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          t types.

        if "target_name" not in targets[self.ref]:
            raise GypError("Missing 'target_name' field in target.")

        if "type" not in targets[self.ref]:
            raise GypError(
                "Missing 'type' field in target %s" % targets[self.ref]["target_name"]
            )

        target_type = targets[self.ref]["type"]

        is_linkable = target_type in linkable_types

        if initial and not is_linkable:
            # If this is the first target being examined and it's not linkable,
            # return an empty list of link dependencies, because the link
            # dependencies are intended to apply to the target itself (initial is
            # True) and this target won't be linked.
            return dependencies

        # Don't traverse 'none' targets if explicitly excluded.
        if target_type == "none" and not targets[self.ref].get(
            "dependencies_traverse", True
        ):
            dependencies.add(self.ref)
            return dependencies

        # Executables, mac kernel extensions, windows drivers and loadable modules
        # are already fully and finally linked. Nothing else can be a link
        # dependency of them, there can only be dependencies in the sense that a
        # dependent target might run an executable or load the loadable_module.
        if not initial and target_type in (
            "executable",
            "loadable_module",
            "mac_kernel_extension",
            "windows_driver",
        ):
            return dependencies

        # Shared libraries are already fully linked.  They should only be included
        # in |dependencies| when adjusting static library dependencies (in order to
        # link against the shared_library's import lib), but should not be included
        # in |dependencies| when propagating link_settings.
        # The |include_shared_libraries| flag controls which of these two cases we
        # are handling.
        if (
            not initial
            and target_type == "shared_library"
            and not include_shared_libraries
        ):
            return dependencies

        # The target is linkable, add it to the list of link dependencies.
        if self.ref not in dependencies:
            dependencies.add(self.ref)
            if initial or not is_linkable:
                # If this is a subsequent target and it's linkable, don't l                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      )

                # Take the wildcard out and adjust the index so that the next
                # dependency in the list will be processed the next time through the
                # loop.
                del dependencies[index]
                index = index - 1

                # Loop through the targets in the other build file, adding them to
                # this target's list of dependencies in place of the removed
                # wildcard.
                dependency_target_dicts = data[dependency_build_file]["targets"]
                for dependency_target_dict in dependency_target_dicts:
                    if int(dependency_target_dict.get("suppress_wildcard", False)):
                        continue
                    dependency_target_name = dependency_target_dict["target_name"]
                    if (
                        dependency_target not in {"*", dependency_target_name}
                    ):
                        continue
                    dependency_target_toolset = dependency_target_dict["toolset"]
                    if (
                        dependency_toolset not in {"*", dependency_target_toolset}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  new_configuration_dict,
            build_file,
            target_dict,
            parent,
            visited + [configuration],
        )

    # Merge it into the new config.
    MergeDicts(new_configuration_dict, configuration_dict, build_file, build_file)

    # Drop abstract.
    if "abstract" in new_configuration_dict:
        del new_configuration_dict["abstract"]


def SetUpConfigurations(target, target_dict):
    # key_suffixes is a list of key suffixes that might appear on key names.
    # These suffixes are handled in conditional evaluations (for =, +, and ?)
    # and rules/exclude processing (for ! and /).  Keys with these suffixes
    # should be treated the same as keys without.
    key_suffixes = ["=", "+", "?", "!", "/"]

    build_file = gyp.common.BuildFile(target)

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      tomatics and the loading of the variables dict.
    variables = variables_in.copy()
    LoadAutomaticVariablesFromDict(variables, the_dict)

    if "variables" in the_dict:
        # Make sure all the local variables are added to the variables
        # list before we process them so that you can reference one
        # variable from another.  They will be fully expanded by recursion
        # in ExpandVariables.
        for key, value in the_dict["variables"].items():
            variables[key] = value

        # Handle the associated variables dict first, so that any variable
        # references within can be resolved prior to using them as variables.
        # Pass a copy of the variables dict to avoid having it be tainted.
        # Otherwise, it would have extra automatics add                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            self.dependencies = []
        self.dependents = []

    def __repr__(self):
        return "<DependencyGraphNode: %r>" % self.ref

    def FlattenToList(self):
        # flat_list is the sorted list of dependencies - actually, the list items
        # are the "ref" attributes of DependencyGraphNodes.  Every target will
        # appear in flat_list after all of its dependencies, and before all of its
        # dependents.
        flat_list = OrderedSet()

        def ExtractNodeRef(node):
            """Extracts the object that the node represents from the given node."""
            return node.ref

        # in_degree_zeros is the list of DependencyGraphNodes that have no
        # dependencies not in flat_list.  Initially, it is a copy of the children
        # of this node, because when the graph was built, nodes with no
        # dependencies w                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               e.offset,
            e.text,
        )
        raise syntax_error
    except NameError as e:
        gyp.common.ExceptionAppend(
            e,
            f"while evaluating condition '{cond_expr_expanded}' in {build_file}",
        )
        raise GypError(e)


def ProcessConditionsInDict(the_dict, phase, variables, build_file):
    # Process a 'conditions' or 'target_conditions' section in the_dict,
    # depending on phase.
    # early -> conditions
    # late -> target_conditions
    # latelate -> no conditions
    #
    # Each item in a conditions list consists of cond_expr, a string expression
    # evaluated as the condition, and true_dict, a dict that will be merged into
    # the_dict if cond_expr evaluates t                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      es will be made of objects that require it.
            if k not in to:
                to[k] = {}
            MergeDicts(to[k], v, to_file, fro_file)
        elif isinstance(v, list):
            # Lists in dicts can be merged with different policies, depending on
            # how the key in the "from" dict (k, the from-key) is written.
            #
            # If the from-key has          ...the to-list will have this action
            # this character appended:...     applied when receiving the from-list:
            #                           =  replace
            #                           +  prepend
            #                           ?  set, only if to-list does not yet exist
            #                      (none)  append
            #
            # This logic is list-specific, but since it relies on the associated
            # dict key, it's checked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           ict:
            for regex_item in the_dict[regex_key]:
                [action, pattern] = regex_item
                pattern_re = re.compile(pattern)

                if action == "exclude":
                    # This item matches an exclude regex, set its value to 0 (exclude).
                    action_value = 0
                elif action == "include":
                    # This item matches an include regex, set its value to 1 (include).
                    action_value = 1
                else:
                    # This is an action that doesn't make any sense.
                    raise ValueError(
                        "Unrecognized action "
                        + action
                        + " in "
                        + name
                        + " key "
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        e next dependency to analyze will shift into the index
                    # formerly occupied by the one being removed.
                    del dependencies[index]
                else:
                    index = index + 1

            # Update the dependencies. If the dependencies list is empty, it's not
            # needed, so unhook it.
            if len(dependencies) > 0:
                target_dict["dependencies"] = dependencies
            else:
                del target_dict["dependencies"]

        elif target_type in linkable_types:
            # Get a list of dependency targets that should be linked into this
            # target.  Add them to the dependencies list if they're not already
            # present.

            link_dependencies = dependency_nodes[target].DependenciesToLinkAgainst(
                targets
            )
            for dependency in link_dependencies:
                if dependency == target:
                    continue
                if "dependencies" not in target_dict:
                    target_dict["dependencies"] = []
                if dependency not in target_dict["dependencies"]:
                    target_dic                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ter.
    hashable_to_set = {x for x in to if is_hashable(x)}
    for item in fro:
        singleton = False
        if type(item) in (str, int):
            # The cheap and easy case.
            to_item = MakePathRelative(to_file, fro_file, item) if is_paths else item

            if not (isinstance(item, str) and item.startswith("-")):
                # Any string that doesn't begin with a "-" is a singleton - it can
                # only appear once in a list, to be enforced by the list merge append
                # or prepend.
                singleton = True
        elif isinstance(item, dict):
            # Make a copy of the dictionary, continuing to look for paths to fix.
            # The other intelligent aspects of merge processing won't apply because
            # item is being me                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           ndencyGraphNode(target)

    # Set up the dependency links.  Targets that have no dependencies are treated
    # as dependent on root_node.
    root_node = DependencyGraphNode(None)
    for target, spec in targets.items():
        target_node = dependency_nodes[target]
        dependencies = spec.get("dependencies")
        if not dependencies:
            target_node.dependencies = [root_node]
            root_node.dependents.append(target_node)
        else:
            for dependency in dependencies:
                dependency_node = dependency_nodes.get(dependency)
                if not dependency_node:
                    raise GypError(
                        "Dependency '%s' not found while "
                        "trying to load target %s" % (dependency, target)
                    )
                target_node.dependencies.append(dependency_node)
                dependency_node.dependents.append(target_node)

    flat_list = root_node.FlattenToList()

    # If there's anything left unvisited, there must be a circular dependency
    # (cycle).
    if len(flat_list) != len(targets):
        if not root_node.dependents:
            # If all targets have dependencies, add the first target as a dependent
            # of root_node so that the cycle can be discovered from root_node.
            target = next(iter(targets))
            target_node = dependency_nodes[target]
            target_node.dependencies.append(root_node)
            root_node.dependents.append(target_node)

        cycles = []
        for cycle in root_node.FindCycles():
            paths = [node.ref for node in cycle]
            cycles.append("Cycle: %s" % " -> ".join(paths))
        raise DependencyGraphNode.CircularException(
            "Cycles in dependency graph detected:\n" + "\n".join(cycles)
        )

    return [dependency_nodes, flat_list]


def VerifyNoGYPFileCircularDependencies(targets):
    # Create a DependencyGraphNode for each gyp file containing a target.  Put
    # it into a dict for easy access.
    dependency_nodes = {}
    for target in targets:
        build_file = gyp.common.BuildFile(target)
        if build_file not in dependency_nodes:
            dependency_nodes[build_file] = DependencyGraphNo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             erates on the list
    of dependencies in the |dependencies| argument.  For each dependency in
    that list, if any declares that it exports the settings of one of its
    own dependencies, those dependencies whose settings are "passed through"
    are added to the list.  As new items are added to the list, they too will
    be processed, so it is possible to import settings through multiple levels
    of dependencies.

    This method is not terribly useful on its own, it depends on being
    "primed" with a list of direct dependencies such as one provided by
    DirectDependencies.  DirectAndImportedDependencies is intended to be the
    public entry point.
    """

        if dependencies is None:
            dependencies = []

        index = 0
        while index < len(dependencies):
            dependency = dependencies[index]
            dependency_dict = targets[dependency]
            # Add any dependencies whose settings should be imported to the list                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  variables = variables_in.copy()
    LoadAutomaticVariablesFromDict(variables, the_dict)
    LoadVariablesFromVariablesDict(variables, the_dict, the_dict_key)

    # Recurse into child dicts, or process child lists which may result in
    # further recursion into descendant dicts.
    for key, value in the_dict.items():
        # Skip "variables" and string values, which were already processed if
        # present.
        if key == "variables" or isinstance(value, str):
            continue
        if isinstance(value, dict):
            # Pass a copy of the variables dict so that subdicts can't influence
            # parents.
            ProcessVariablesAndConditionsInDict(
                value, phase, variables, build_file, key
            )
        elif isinstance(value, list):
            # The list itself can't influence the variables dict, and
            # ProcessVariablesAndConditionsInList will make copies of the variables
            # dict if it needs to pass it to something that can influence it.  No
            # copy is necessary here.
            ProcessVariablesAndConditionsInList(value, phase, variables, build_file)
        elif not isinstance(value, int):
            raise TypeError("Unknown type " + value.__class__.__name__ + " for " + key)


def ProcessVariablesAndConditionsInList(the_list, phase, variables, build_file):
    # Iterate using an index so that new values can be assigned into the_list.
    index = 0
    while index < len(the_list):
        item = the_list[index]
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ative to the current directory.

  |targets| is a dict mapping fully-qualified target names to their target
  dicts.  For each target in this dict, keys known to contain dependency
  links are examined, and any dependencies referenced will be rewritten
  so that they are fully-qualified and relative to the current directory.
  All rewritten dependencies are suitable for use as keys to |targets| or a
  similar dict.
  """

    all_dependency_sections = [
        dep + op for dep in dependency_sections for op in ("", "!", "/")
    ]

    for target, target_dict in targets.items():
        target_build_file = gyp.common.BuildFile(target)
        toolset = target_dict["toolset"]
        for dependency_key in all_dependency_sections:
            dependencies = target_dict.get(dependency_key, [])
            for index, dep in enumerate(dependencies):
                dep_file, de                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           ded" list in the dict.

  Regular expression (regex) filters are contained in dict keys named with a
  trailing "/", such as "sources/" to operate on the "sources" list.  Regex
  filters in a dict take the form:
    'sources/': [ ['exclude', '_(linux|mac|win)\\.cc$'],
                  ['include', '_mac\\.cc$'] ],
  The first filter says to exclude all files ending in _linux.cc, _mac.cc, and
  _win.cc.  The second filter then includes all files ending in _mac.cc that
  are now or were once in the "sources" list.  Items matching an "exclude"
  filter are subject to the same processing as would occur if they were listed
  by name in an exclusion list (ending in "!").  Items matching an "include"
  filter are brought back into the main                                                                                                                                                                                                                                                                               