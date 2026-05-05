import { WebSocketSubject, WebSocketSubjectConfig } from './WebSocketSubject';

/**
 * Wrapper around the w3c-compatible WebSocket object provided by the browser.
 *
 * <span class="informal">{@link Subject} that communicates with a server via WebSocket</span>
 *
 * `webSocket` is a factory function that produces a `WebSocketSubject`,
 * which can be used to make WebSocket connection with an arbitrary endpoint.
 * `webSocket` accepts as an argument either a string with url of WebSocket endpoint, or an
 * {@link WebSocketSubjectConfig} object for providing additional configuration, as
 * well as Observers for tracking lifecycle of WebSocket connection.
 *
 * When `WebSocketSubject` is subscribed, it attempts to make a socket connection,
 * unless there is one made already. This means that many subscribers will always listen
 * on the same socket, thus saving resources. If however, two instances are made of `WebSocketSubject`,
 * even if these two were provided with the same url, they will attempt to make separate
 * connections. When consumer of a `WebSocketSubject` unsubscribes, socket connection is closed,
 * only if there are no more subscribers still listening. If after some time a consumer starts
 * subscribing again, connection is reestablished.
 *
 * Once connection is made, whenever a new message comes from the server, `WebSocketSubject` will emit that
 * message as a value in the stream. By default, a message from the socket is parsed via `JSON.parse`. If you
 * want to customize how deserialization is handled (if at all), you can provide custom `resultSelector`
 * function in {@link WebSocketSubject}. When connection closes, stream will complete, provided it happened without
 * any errors. If at any point (starting, maintaining or closing a connection) there is an error,
 * stream will also error with whatever WebSocket API has thrown.
 *
 * By virtue of being a {@link Subject}, `WebSocketSubject` allows for receiving and sending messages from the server. In order
 * to communicate with a connected endpoint, use `next`, `error` and `complete` methods. `next` sends a value to the server, so bear in mind
 * that this value will not be serialized beforehand. Because of This, `JSON.stringify` will have to be called on a value by hand,
 * before calling `next` with a result. Note also that if at the moment of nexting value
 * there is no socket connection (for example no one is subscribing), those values will be buffered, and sent when connection
 * is finally established. `complete` method closes socket connection. `error` does the same,
 * as well as notifying the server that something went wrong via status code and string with details of what happened.
 * Since status code is required in WebSocket API, `WebSocketSubject` does not allow, like regular `Subject`,
 * arbitrary values being passed to the `error` method. It needs to be called with an object that has `code`
 * property with status code number and optional `reason` property with string describing details
 * of an error.
 *
 * Calling `next` does not affect subscribers of `WebSocketSubject` - they have no
 * information that something was sent to the server (unless of course the server
 * responds somehow to a message). On the other hand, since calling `complete` triggers
 * an attempt to close socket connection. If that connection is closed without any errors, stream will
 * complete, thus notifying all subscribers. And since calling `error` closes
 * socket connection as well, just with a different status code for the server, if closing itself proceeds
 * without errors, subscribed Observable will not error, as one might expect, but complete as usual. In both cases
 * (calling `complete` or `error`), if process of closing socket connection results in some errors, *then* stream
 * will error.
 *
 * **Multiplexing**
 *
 * `WebSocketSubject` has an additional operator, not found in other Subjects. It is called `multiplex` and it is
 * used to simulate opening several socket connections, while in reality maintaining only one.
 * For example, an application has both chat panel and real-time notifications about sport news. Since these are two distinct functions,
 * it would make sense to have two separate connections for each. Perhaps there could even be two separate services with WebSocket
 * endpoints, running on separate machines with only GUI combining them together. Having a socket connection
 * for each functionality could become too resource expensive. It is a common pattern to have single
 * WebSocket endpoint that acts as a gateway for the other services (in this case chat and sport news services).
 * Even though there is a single connection in a client app, having the ability to manipulate streams as if it
 * were two separate sockets is desirable. This eliminates manually registering and unregistering in a gateway for
 * given service and filter out messages of interest. This is exactly what `multiplex` method is for.
 *
 * Method accepts three parameters. First two are functions returning subscription and unsubscription messages
 * respectively. These are messages that will be sent to the server, whenever consumer of resulting Observable
 * subscribes and unsubscribes. Server can use them to verify that some kind of messages should start or stop
 * being forwarded to the client. In case of the above example application, after getting subscription message with proper identifier,
 * gateway server can decide that it should connect to real sport news service and start forwarding messages from it.
 * Note that both messages will be sent as returned by the functions, they are by default serialized using JSON.stringify, just
 * as messages pushed via `next`. Also bear in mind that these messages will be sent on *every* subscription and
 * unsubscription. This is potentially dangerous, because one consumer of an Observable may unsubscribe and the server
 * might stop sending messages, since it got unsubscription message. This needs to be handled
 * on the server or using {@link publish} on a Observable returned from 'multiplex'.
 *
 * Last argument to `multiplex` is a `messageFilter` function which should return a boolean. It is used to filter out messages
 * sent by the server to only those that belong to simulated WebSocket stream. For example, server might mark these
 * messages with some kind of string identifier on a message object and `messageFilter` would return `true`
 * if there is such identifier on an object emitted by the socket. Messages which returns `false` in `messageFilter` are simply skipped,
 * and are not passed down the stream.
 *
 * Return value of `multiplex` is an Observable with messages incoming from emulated socket connection. Note that this
 * is not a `WebSocketSubject`, so calling `next` or `multiplex` again will fail. For pushing values to the
 * server, use root `WebSocketSubject`.
 *
 * ## Examples
 *
 * Listening for messages from the server
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const subject = webSocket('ws://localhost:8081');
 *
 * subject.subscribe({
 *   next: msg => console.log('message received: ' + msg), // Called whenever there is a message from the server.
 *   error: err => console.log(err), // Called if at any point WebSocket API signals some kind of error.
 *   complete: () => console.log('complete') // Called when connection is closed (for whatever reason).
 *  });
 * ```
 *
 * Pushing messages to the server
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const subject = webSocket('ws://localhost:8081');
 *
 * subject.subscribe();
 * // Note that at least one consumer has to subscribe to the created subject - otherwise "nexted" values will be just buffered and not sent,
 * // since no connection was established!
 *
 * subject.next({ message: 'some message' });
 * // This will send a message to the server once a connection is made. Remember value is serialized with JSON.stringify by default!
 *
 * subject.complete(); // Closes the connection.
 *
 * subject.error({ code: 4000, reason: 'I think our app just broke!' });
 * // Also closes the connection, but let's the server know that this closing is caused by some error.
 * ```
 *
 * Multiplexing WebSocket
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const subject = webSocket('ws://localhost:8081');
 *
 * const observableA = subject.multiplex(
 *   () => ({ subscribe: 'A' }), // When server gets this message, it will start sending messages for 'A'...
 *   () => ({ unsubscribe: 'A' }), // ...and when gets this one, it will stop.
 *   message => message.type === 'A' // If the function returns `true` message is passed down the stream. Skipped if the function returns false.
 * );
 *
 * const observableB = subject.multiplex( // And the same goes for 'B'.
 *   () => ({ subscribe: 'B' }),
 *   () => ({ unsubscribe: 'B' }),
 *   message => message.type === 'B'
 * );
 *
 * const subA = observableA.subscribe(messageForA => console.log(messageForA));
 * // At this moment WebSocket connection is established. Server gets '{"subscribe": "A"}' message and starts sending messages for 'A',
 * // which we log here.
 *
 * const subB = observableB.subscribe(messageForB => console.log(messageForB));
 * // Since we already have a connection, we just send '{"subscribe": "B"}' message to the server. It starts sending messages for 'B',
 * // which we log here.
 *
 * subB.unsubscribe();
 * // Message '{"unsubscribe": "B"}' is sent to the server, which stops sending 'B' messages.
 *
 * subA.unsubscribe();
 * // Message '{"unsubscribe": "A"}' makes the server stop sending messages for 'A'. Since there is no more subscribers to root Subject,
 * // socket connection closes.
 * ```
 *
 * @param {string|WebSocketSubjectConfig} urlConfigOrSource The WebSocket endpoint as an url or an object with
 * configuration and additional Observers.
 * @return {WebSocketSubject} Subject which allows to both send and receive messages via WebSocket connection.
 */
export function webSocket<T>(urlConfigOrSource: string | WebSocketSubjectConfig<T>): WebSocketSubject<T> {
  return new WebSocketSubject<T>(urlConfigOrSource);
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               import { MonoTypeOperatorFunction, SchedulerLike, OperatorFunction, ObservableInput, ObservedValueOf } from '../types';
export interface TimeoutConfig<T, O extends ObservableInput<unknown> = ObservableInput<T>, M = unknown> {
    /**
     * The time allowed between values from the source before timeout is triggered.
     */
    each?: number;
    /**
     * The relative time as a `number` in milliseconds, or a specific time as a `Date` object,
     * by which the first value must arrive from the source before timeout is triggered.
     */
    first?: number | Date;
    /**
     * The scheduler to use with time-related operations within this operator. Defaults to {@link asyncScheduler}
     */
    scheduler?: SchedulerLike;
    /**
     * A factory used to create observable to switch to when timeout occurs. Provides
     * a {@link TimeoutInfo} about the source observable's emissions and what delay or
     * exact time triggered the timeout.
     */
    with?: (info: TimeoutInfo<T, M>) => O;
    /**
     * Optional additional metadata you can provide to code that handles
     * the timeout, will be provided through the {@link TimeoutError}.
     * This can be used to help identify the source of a timeout or pass along
     * other information related to the timeout.
     */
    meta?: M;
}
export interface TimeoutInfo<T, M = unknown> {
    /** Optional metadata that was provided to the timeout configuration. */
    readonly meta: M;
    /** The number of messages seen before the timeout */
    readonly seen: number;
    /** The last message seen */
    readonly lastValue: T | null;
}
/**
 * An error emitted when a timeout occurs.
 */
export interface TimeoutError<T = unknown, M = unknown> extends Error {
    /**
     * The information provided to the error by the timeout
     * operation that created the error. Will be `null` if
     * used directly in non-RxJS code with an empty constructor.
     * (Note that using this constructor directly is not recommended,
     * you should create your own errors)
     */
    info: TimeoutInfo<T, M> | null;
}
export interface TimeoutErrorCtor {
    /**
     * @deprecated Internal implementation detail. Do not construct error instances.
     * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
     */
    new <T = unknown, M = unknown>(info?: TimeoutInfo<T, M>): TimeoutError<T, M>;
}
/**
 * An error thrown by the {@link timeout} operator.
 *
 * Provided so users can use as a type and do quality comparisons.
 * We recommend you do not subclass this or create instances of this class directly.
 * If you have need of a error representing a timeout, you should
 * create your own error class and use that.
 *
 * @see {@link timeout}
 *
 * @class TimeoutError
 */
export declare const TimeoutError: TimeoutErrorCtor;
/**
 * If `with` is provided, this will return an observable that will switch to a different observable if the source
 * does not push values within the specified time parameters.
 *
 * <span class="informal">The most flexible option for creating a timeout behavior.</span>
 *
 * The first thing to know about the configuration is if you do not provide a `with` property to the configuration,
 * when timeout conditions are met, this operator will emit a {@link TimeoutError}. Otherwise, it will use the factory
 * function provided by `with`, and switch your subscription to the result of that. Timeout conditions are provided by
 * the settings in `first` and `each`.
 *
 * The `first` property can be either a `Date` for a specific time, a `number` for a time period relative to the
 * point of subscription, or it can be skipped. This property is to check timeout conditions for the arrival of
 * the first value from the source _only_. The timings of all subsequent values  from the source will be checked
 * against the time period provided by `each`, if it was provided.
 *
 * The `each` property can be either a `number` or skipped. If a value for `each` is provided, it represents the amount of
 * time the resulting observable will wait between the arrival of values from the source before timing out. Note that if
 * `first` is _not_ provided, the value from `each` will be used to check timeout conditions for the arrival of the first
 * value and all subsequent values. If `first` _is_ provided, `each` will only be use to check all values after the first.
 *
 * ## Examples
 *
 * Emit a custom error if there is too much time between values
 *
 * ```ts
 * import { interval, timeout, throwError } from 'rxjs';
 *
 * class CustomTimeoutError extends Error {
 *   constructor() {
 *     super('It was too slow');
 *     this.name = 'CustomTimeoutError';
 *   }
 * }
 *
 * const slow$ = interval(900);
 *
 * slow$.pipe(
 *   timeout({
 *     each: 1000,
 *     with: () => throwError(() => new CustomTimeoutError())
 *   })
 * )
 * .subscribe({
 *   error: console.error
 * });
 * ```
 *
 * Switch to a faster observable if your source is slow.
 *
 * ```ts
 * import { interval, timeout } from 'rxjs';
 *
 * const slow$ = interval(900);
 * const fast$ = interval(500);
 *
 * slow$.pipe(
 *   timeout({
 *     each: 1000,
 *     with: () => fast$,
 *   })
 * )
 * .subscribe(console.log);
 * ```
 * @param config The configuration for the timeout.
 */
export declare function timeout<T, O extends ObservableInput<unknown>, M = unknown>(config: TimeoutConfig<T, O, M> & {
    with: (info: TimeoutInfo<T, M>) => O;
}): OperatorFunction<T, T | ObservedValueOf<O>>;
/**
 * Returns an observable that will error or switch to a different observable if the source does not push values
 * within the specified time parameters.
 *
 * <span class="informal">The most flexible option for creating a timeout behavior.</span>
 *
 * The first thing to know about the configuration is if you do not provide a `with` property to the configuration,
 * when timeout conditions are met, this operator will emit a {@link TimeoutError}. Otherwise, it will use the factory
 * function provided by `with`, and switch your subscription to the result of that. Timeout conditions are provided by
 * the settings in `first` and `each`.
 *
 * The `first` property can be either a `Date` for a specific time, a `number` for a time period relative to the
 * point of subscription, or it can be skipped. This property is to check timeout conditions for the arrival of
 * the first value from the source _only_. The timings of all subsequent values  from the source will be checked
 * against the time period provided by `each`, if it was provided.
 *
 * The `each` property can be either a `number` or skipped. If a value for `each` is provided, it represents the amount of
 * time the resulting observable will wait between the arrival of values from the source before timing out. Note that if
 * `first` is _not_ provided, the value from `each` will be used to check timeout conditions for the arrival of the first
 * value and all subsequent values. If `first` _is_ provided, `each` will only be use to check all values after the first.
 *
 * ### Handling TimeoutErrors
 *
 * If no `with` property was provided, subscriptions to the resulting observable may emit an error of {@link TimeoutError}.
 * The timeout error provides useful information you can examine when you're handling the error. The most common way to handle
 * the error would be with {@link catchError}, although you could use {@link tap} or just the error handler in your `subscribe` call
 * directly, if your error handling is only a side effect (such as notifying the user, or logging).
 *
 * In this case, you would check the error for `instanceof TimeoutError` to validate that the error was indeed from `timeout`, and
 * not from some other source. If it's not from `timeout`, you should probably rethrow it if you're in a `catchError`.
 *
 * ## Examples
 *
 * Emit a {@link TimeoutError} if the first value, and _only_ the first value, does not arrive within 5 seconds
 *
 * ```ts
 * import { interval, timeout } from 'rxjs';
 *
 * // A random interval that lasts between 0 and 10 seconds per tick
 * const source$ = interval(Math.round(Math.random() * 10_000));
 *
 * source$.pipe(
 *   timeout({ first: 5_000 })
 * )
 * .subscribe({
 *   next: console.log,
 *   error: console.error
 * });
 * ```
 *
 * Emit a {@link TimeoutError} if the source waits longer than 5 seconds between any two values or the first value
 * and subscription.
 *
 * ```ts
 * import { timer, timeout, expand } from 'rxjs';
 *
 * const getRandomTime = () => Math.round(Math.random() * 10_000);
 *
 * // An observable that waits a random amount of time between each delivered value
 * const source$ = timer(getRandomTime())
 *   .pipe(expand(() => timer(getRandomTime())));
 *
 * source$
 *   .pipe(timeout({ each: 5_000 }))
 *   .subscribe({
 *     next: console.log,
 *     error: console.error
 *   });
 * ```
 *
 * Emit a {@link TimeoutError} if the source does not emit before 7 seconds, _or_ if the source waits longer than
 * 5 seconds between any two values after the first.
 *
 * ```ts
 * import { timer, timeout, expand } from 'rxjs';
 *
 * const getRandomTime = () => Math.round(Math.random() * 10_000);
 *
 * // An observable that waits a random amount of time between each delivered value
 * const source$ = timer(getRandomTime())
 *   .pipe(expand(() => timer(getRandomTime())));
 *
 * source$
 *   .pipe(timeout({ first: 7_000, each: 5_000 }))
 *   .subscribe({
 *     next: console.log,
 *     error: console.error
 *   });
 * ```
 */
export declare function timeout<T, M = unknown>(config: Omit<TimeoutConfig<T, any, M>, 'with'>): OperatorFunction<T, T>;
/**
 * Returns an observable that will error if the source does not push its first value before the specified time passed as a `Date`.
 * This is functionally the same as `timeout({ first: someDate })`.
 *
 * <span class="informal">Errors if the first value doesn't show up before the given date and time</span>
 *
 * ![](timeout.png)
 *
 * @param first The date to at which the resulting observable will timeout if the source observable
 * does not emit at least one value.
 * @param scheduler The scheduler to use. Defaults to {@link asyncScheduler}.
 */
export declare function timeout<T>(first: Date, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>;
/**
 * Returns an observable that will error if the source does not push a value within the specified time in milliseconds.
 * This is functionally the same as `timeout({ each: milliseconds })`.
 *
 * <span class="informal">Errors if it waits too long between any value</span>
 *
 * ![](timeout.png)
 *
 * @param each The time allowed between each pushed value from the source before the resulting observable
 * will timeout.
 * @param scheduler The scheduler to use. Defaults to {@link asyncScheduler}.
 */
export declare function timeout<T>(each: number, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>;
//# sourceMappingURL=timeout.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         =C˜@2JEÏqkÕÎ√;Á‡îòá%∞v—àÉY£[v)Ä.?—ûíRÁnª·A9»{Ø]Ç˝ |Quú˝ÅKS#øòÓ9ÿ°2ÅäˇWv:?I9kV¬√#;ïtÂ‚´îú¥n≤æ0($tß4&Ï“◊~,Ô⁄OÑ{3ÚMî¿õ¨Îc?u>7¨òJ„ˆ]≠‚ÁÛ<œ”ûiéﬁø^•%›EIg•v<¡QLEö_›qÑr7,–≤tñ'¡AË]ÕÎ^Lf*!ÔRà |´%õÓŸ‹ùÒ˛2ú–Ãñ≠˜jÇ◊6Ÿ‘†œçº1◊∏ÖŸ'äè∏†ﬂ˝¢„j%`d•'B|\TiVª@Wù*°≈v:∆©.ÃlÃ©∫àªﬂµ.¿…∑œÉU8æ}∫ìŸN¿V±o]\ıß<b4ûm7†öí£]æÅa„=%√œ•+>¢‘ıµ?ﬂù°¶jy.kVÄ,‡~“ùò≠A*8¸Æô◊òéOñƒ\Qdìƒ€1LûTz¸∫ÁøÌ˜«PvöÈi9 lﬂ;É˙Nº‘ú¨˙&ΩÌ†¸˜PƒSGVÒóä≥™ã	n‡0]aÃÃáÀ<Ë}àT b?Ü®<ªó @bΩ‰∑Äo™^ø©©IœÊT|€œƒ÷Æ.Ë`∑)S”I˘∑qbq(Ç⁄òî,iK·ªø–ΩSÍ—∫~âìâdËËõ§¶wæÍIˆ≈éÑRÔ”8a}∏´Ã>·…‘œÍ√ú}…V{¶p?Ò™|¥oëÍ’°¸óE¡!ª/≈î’_w3»Ø^çêÂëéË$´]1(2“àw·@3µˇÎsÅﬂâ}⁄2∆ôâ S∂GÙﬁIPV¨∆V=Eº¸§ß.p_–°h$wÓ^ﬂQ›Â◊î©ü]9Ôøc'e˝è©Óú√üWÀÌLÊ∫KÅ≈˜€m˙•B¯˙õÃ∫6⁄$M@—òı”gπƒoúbDä+ÃÂg‰	Ñ÷•(J6-~$Ç∑Õu/’päfk”˛†·Ëî5ëy©·¬ﬂ∏N§TH¥òËÿ“J¸~øˇy0ÛπTK6ûZ	hõ˙ä+_Ço\œÇ;˘C±vá£7ÕÚÖ=Ë~ø∏•jÎ|´òÉ}Zaˆ™DN“∆n‰H\$ê–{˘„ΩóÉw)«ö∑âÂ∫ZqSîU°g.[Oà^a~»}?¡≈ü:tÊ^>É±#‡Fóè;ma)}~Ù~Ÿ˜Aµª›ÏkvàÌ—ŒGÙ3¥?¶6≤Ìå_mË´’6ÆeË≈ﬁ$iU^≈MÀŸ§¶+πÕ˜Z≤Ê]ÂıAO-]1òÃh‰„Ô¢‹ây[’[˜¯÷A]Ñ{;~æ˘ g:4›v‚	Y˚È¥¶/∂åß#î˝PîqëxÃ‘m-=wˇ∫`Æêßp‚+9Œ˚—¯ˆhÕ˜:ƒf˛y™ÒP≤ﬂ∞:J,˝˛—úπRIßE0
=O≈±¯ÚGÛè‚t£Ò‹©Pãcg´è|Nd_ƒ™∑¶ÒŸSO 0Ø€$ˆZáÂ∂bÍæH€ôqæ!¥≥9Õ©]'zQm—_û6Å∑M¥w ·Ω`˛Ô›{s ˘RCÉEÖ ¢˜OÚÓˆ3S3A¯K—¬÷•@¨XºXØ:vó/¥[ÖÈıÂ6@Ò$Ï*»s-pç¨|‹ ˆ&≥∞∂É=Gê[?CPÙå–	q˚·dÕ!8NUöß}–ï)%Â}áC¡õT’˛AJÀü$˙˛`K<Íãƒû≈$‚L#º 4¥ÜU
ÛûmmMûb!.¯ˆ.k“®$´«Ú⁄ë^«ÚA«Û£oŒßLÔ`Jî’Ã∫¯ñ¬nà¸8ƒÈvj˘dÏ;≈õsÈLéxÄ∆ôÌ@5ÍÉÃ‡{7â)Âñ®<ÎÏ“˜´ŸÓM‹G∂?\¶Üº*%%ô”fHˇJç™~^aÎ∆'cªBrœ≈ï’0n\–@[6™_·-‚·¥MÎ¯-æöìµ÷TÀËßÜ±≥ª˙zﬁ~(ü‰“
Ñ¯5¢ìò[Ø£3Gd8‘Üõ/»Ô2Ù4ÒiV√f$?Ëò\K‚Ω¡î1H’`E∫Q¿[![Í¢9äÅ≤Œj√à—…øπU]◊t—3n/ct§V)pÒÎÑ¿pÉ-§[oè›ä∑ëˇ,Fc©¸¶2£h∏ˆ≠üK-îÀ∂ õÅŸÇ~üê4ëÄ¥‹÷5÷?MMÂ[±62CÄÅ%K¥w}∫ﬂ˛®∏GƒÌ
Zd»ÖôUpπ}˝?°yïmbfÌLhIq}–¯ﬁ¸úÛ*Ç”‹-ñ;˚:+–e®	∂›Ùáê÷0§Y'◊<wÂì@ﬁF›Ù∂∂¡ˇ¯7Ïíîí™B¯ôˆ"çÎ[9J™Ú√j≈æıΩ¶ñÏ*+Om/ÂíRµï—ÂLó˙‘¬ëü√†‡ﬁ¨@ÏiÉX¢¬îˆ&PNE€nwˇ«&aï«WD[°KÖPu&“öS•‚“®∂á÷‚˚'G‡∞ò≥¬ÿÔ]ïe€ñGDBÕB4=ÈCıœvìt‚AÔÔ áw9ûrL–È}T°yå°ÒRrlê¡T∏√ﬁÜ¿˝;“ú√¥µkø«™ùª´§u≠K¡(àÜìí~BÛ ‹Á[∑ƒ•%ΩÈTóÿB∫¥∆5◊∫?»+Î	õn´u·Aznå∂ ÓOh:˚«R0„ì¸1C9G”Îªií∏^Irxv∞@)CàÒhGLËç5ëÅÃ(∫˚”ˇÚ›ŸÄ#ﬂùù_jä>$?Ω<§[HÈõÎåı‹~ﬁ?öLdÍ$3M¿&Ûh ∞¢AÖ "Ap¨…-Ÿ¶ÉUGàMvï˝¡Òú7Øq€¢.€¢W\ß∑;ˇΩ∂‰É’"Iq´VH^ÉéS¢ó¬ooúƒ ÜwOp|èèc˜\µ
øÜÑòŒ€¢√¸Ûñ>BÆ„?·åˇDEÏ1L£˝ì¢w—rÙÀ1¸:ÍKüäbÕ }:-®)˝f9≤–+JÜQJF~Œ@Ω¥–˚Æ6ed••$kÑù•U"@)è¯>!Uì¶πNü‘˚ø	iMH†‰¸fgkÌ¡·ííB ÔOKYª|Iäoç™Ä4ÿ2+§Ô€÷.˛J‚¨46në∫™‡BV®£|Ñ-e˜É‡∆-F:Vs≠¡ﬁïÅ&UUÏ}áüGñ(…œtq†ÑqqˇtUø„ﬁãˇ1ªh⁄2Õq‚ƒúuˇ>Xõ∫§wrﬂä¢q:"u¯íŒÌì=ßFkÊL”Ht+p‚˘X∑<Î∞éA”¢›«ÀF˙œ2, ´Í∞˛úôÊÂwÌ√{ﬂ˛ÀR•0Ì√••l< ∑é:gı∂§ƒ
Ix—”ı§FRûÎ≤SﬂŸÊ6Um‹ø	ÑsÎ¢ŒBärG/ÆŸ|Ñrúö5a≈Ü8w⁄lÓ.ß1Á‡˚‡+≥π—Au-í ﬁ4ÂâhSl‹‡1èÀõ‘Ù(N=ùLÂ—‹|:ÆÏ®J¥–à)ê≠_„±íè jﬂ?πÇ›-◊
DœÑPÃwÑ«˘~Jj†√‹Õ°ç∞ -dI»—ífSÏ&ÇÒ&îN3⁄ÄeQ=Gy©áä;^Í|ˆ∂dyp´vCrd^ù™\ÂŸ`[Ê¨∆q:fò›ˆ é∂^õV=⁄ Y≈Wï÷22º\Ω[ØÄ∆∑[˛	n¡:Cè?Ã◊xt•MHOﬁı±¡πÆ)‡÷∆:¬CﬁaYfîP„√:Ä£Ûc
ld“Ωö®/‹3∆‡>b¬ÊKò™UàD¸O2ÑÅp›nÅıëazô´QQüvÓ9{©ÂtHæ1äm∑0vﬁoMêFÕV
¶kœ‚b˘íÑË_≈á∫Z¡’Ä∂H\Êí© ‹ü⁄,R⁄ ˆß‡≠Ef@Õ®k_v¢˜x±Ë·Ùπ·ô\|29^	≥gﬂ¯&M˙B/òåcî"s“Ó®ı…l[I{bv®J„ßl1(∏HTPC≈¿ΩÜLÎ¯ï∑gœV¬ç´%;eÔô—ÇöÂww^¢{>_b:%P1’R,˚6”Wüº-BÄ9p›ê._fô˜k]%¶∏íπ~≤îõÊ:EïVêÙÃ&z˘Ä+·EJïCÅÎê"‘ˇÁçúJöπx>ø —ÿ∏2;¿ﬂíSÈmò_ÍÈ˝8ÖÒÚ‹Ixı°+ù≈+÷∫ñ©Ç9'G˝¬yëÔ„%P NzH¡á™É&;ÀÏÊjZ¶ES{“≥≥ü√P˚(›s7ˇçkñ◊^RËi7_’âln,|Å35≠„7Èü#ÁYDéÚâ∆#mòÿΩ≠_jFçüYÈÁ”Ç“≤ï∑_w}˜ÉöK^•èÙ∑ÁΩ ÚÑ!◊òâbd(Üõ›pùm§ø≥g‘;z•ñÙU∂ã°òˆûı9¿xwf9ÕëÖQ∆‚_^*we€ê≤åtezºë•Û ¿T‚‘ƒn<≈<tÅ[ŒæŸ•vdÄè˛O4_Ÿ%ÓÕçiu–∑Ü\‘e%ZÆÓÊf¡Ô≥Yvàÿ¢ã6áÂÌø(íôIÿ^˜§$à∏Á◊ùéXÜﬂO˛“F©ΩRó]¡ [ú–≤iÄäUxÙù0…L
3X¬Fl4§Êß`ÊjH˝|Å0±u˜˘≥Z™—an2;Ò”+yÁo‘§ ~9∏Û≠=•æG›†±ò+DŸ2≥è~ëæ="b4Sä:qƒŸçÎ›Ÿ1vÚ˙qa”TÅÜ[àZé;>o2&ÔÖŸœ$ñ6˜UQûÔ^
]ﬂºIÂÉL±€xV√Õ8î–…Ë§g9;6úr}πh3◊ÜÑ›€Âåa$≥£b⁄ÄõÜ'™.áΩÀ¢Aﬁƒ‚öh∫?[\bÎ8&Áπ{MµV€∆•ßÕËJ:µ∂–î“ªLó"âÇﬂÔ‘≠nù)÷´ˇ=µÌ›@Ï‚ıÀ©[gÆÏ^ÿ—lÿk$Ÿü∂ÿe°∂LΩoW?çô¡ü^ıL4kàÒSœa…8ØÃıâ@¿>>OS#Äàû-qı]Ö]$˝Êÿ	ıbDËê\hò8(1ŸëB„&`Ωœ?ª-√“…jπæxÓÙ‚ÿî2ªk*hç¢zı“)WÙ4e§‘≈~õrË€Òh¨öã/€€πNeïê™^+„ÕK"˚¡uè7–_*-ÄdÊ¸µö¸G√¥¥‹!ı∆‰X—¶$rû√;˙≤Åyˆ¥pÜ∞=ıŸc◊5cÔU4
eBÄ^˛h2'ﬂïÓ¡‹√!f…ŒJ’ª˛UëE Ω„ÂQäß‡áßÄå_Üõ±˛<dmj6düo†ÂÀ(¿&«mï-Úz hé˚N	¸∞Z˛˛˙›“˘ 1‰èÁ9≈‹∑ç–ù6ZoàI]5ë√@Wó2…ÇåFg ÿçF(ªq´ä{ —∏°T´“F“"·¬ø¢⁄›~*÷‚)[“'¡âÂ^‚Ü¨»p≤∫êvw"’√úirÆ˜câ¯ö⁄(S◊‚VÄiHƒåLì†±7”HGÄØ8ıM pt“∞
ÈZ6íªeÌ«∑qm≤˙€¿hK0ñ€Q‚œY≥#ÀX›˚d,˚PéG:¡QÖ˛[®ß–\ìæ¥¶€–÷ÿ≠ü>œµÉrDh#∆˜Á*X⁄ƒî˝m’,2hQ5ˇ›‚z†£à
Ø mº¯ı¯:ÕVt—oEeØƒ‘Å9¶ò˜4>G%¨VÕÒeRQBê0£Fzô¡∂ƒ≥¬7i	¸ÍoèsI Ûwò«Í≤S˚QR ]ZÉûÇ]´@nÛífäﬂ•ï”ÕzïöW&›ôJ9
dˆv'â8ÒøWıÂõÊ¿Ò9?ù¨|n8	πÇπ‡ö~.∆˜ø…Ω]s$#$ˇSC9\ˆîÑO˝îaÖ≥√•,Nªo€ˇeÜôıÚï≈èD€˛Ω:b&ÓßLo≥5ì«®æ”LK?”Í>)ôIy¯=Æs®t|j™vß„¶W3|/@c7EGöV◊ä†ı∆Ò4MRM‡  òÆ/~ê8ÿ"¶)>êï£ss(Re]ía´eLãﬂãëÔuDîZ&/%uM™5åå8ã3æ+ 5ÍâÎÇo{tõ¯ FÇbçz2◊‰€Î˙Ü≈k“´»)µlGJ˙%'∫ZgkM<©ßPwK™∆Z<»qM	zµ+T\(3¥'ugÆ…ù&∞ÔıÉ&°;§rö∫Æ.€Û«=¨®ﬂbü$Â^cãÿ‚„íQ<t∑R0D†ù©Ÿ7˚Poœc€g¶í zJ¨OD™cÀfè~EouœiLHû›ßµ|èQ:ò
”l;0Éi¡3ÿaØ-¶jq~>∑‘]BZ9ö‰C2ê00^üIÍS‰©lÑ¿≥	ê≤≥≠©&ÊmËZa° ˚¯AÚc´à;GH `$b∞C:BÕˆ∏T˛Õ´r	»9≠V,ï)ı1ﬂµôP 
m]îItc©ËP∞isÖñoYFgwà∫ÃC$ΩØ5≤¿X›™ÜÑÎ√û©6ªòfÌBãÂîimüS4Vº·p’::"µ!~um—◊ïÎwërÒrSÊDÉ$@+ÙG:}-õqÄ"∆àÃ…µ!ﬂfÍ.Ñ‘ztLXÄò$ƒÖ1áB‰0„†ñôîi3ßNáíC˜Ωñ°3ÌB¿VΩÑƒóƒ◊ƒEGz0*SÙ¨~lWnjªπñ ß2Õ`g_ÖGCª§ˆ+\7º'’DîOû`±€–Û™o‘ZÎÉ’'b›µjÓ\¶[-ûúŸ€%»æÔ´Iƒòﬁ*ÿ6ew⁄áxöÃë®¢DÈYE]Å‘ÄÔ“9)(∂ØõzâÜÄéhF|PÜhpæºâã,LÌöS—¬cÇü¶˛Â!Û‰¡˝óE7Xˆ√˛¬LZˇ´~˘˘bi•„¢?†Ö˜)„uyçÆ™KõΩR)köØ‘ëı≠4#Â'uO÷¥òS•WMÈ	œ±≤Ω–c∫‹mr∆&Êq›£|ô}˙Nj˙!Ω3:˙Stˇë˙È⁄õU^YÕ%˚g≈Í´∞‚:X•æy‰c—˙(ıÀ/›uÂä÷Õ4Å:ìü2àŸ±rÃYßﬁò⁄Û˝zCÅzõ≥75˙Ï¥√oG7§xLâ#0q*∆«HU Ëv›“ZÕQøDπóqÕ/ÙÊ7·9--CsÆ7i»èå≠‘6mÁWﬂ–4≠mßO_Êé‡zh]B]ˇi≠1l“–‡ãã£∂üÿJ˝‡˝˚KnÿD"‚0ŒŒ÷®4íc°¥1Å!}óêCaùCﬂ§ﬁIe˚¸c∆‡C6p)xA≈O21—o ê	U/Ã˛m¸2¨dZÌìs°uc Õ„ã˚;∑Ç-∂¿GâS`ÍkAUË OÜc•>=Oû÷∂”gn1˙	5+á4kw®H ˝∂sGµpã0≥#†.˛‰O˜¨L|∫”óYj¥+}N$ﬂ#X‚õeÍy0ãªøIk±"Eﬂ¡(LìŸ~Ç‡s?Å j±rK¿åÁZ…l"ƒqä≠+Ô%“ı(‚¬«ü÷=a≥ﬂC»+aÁœsÜÚ T⁄	¨ë”ËmÄÿ√(â‰w4ô@2nŒ%uØÁÏü3‹O˚ñ6
±≈–€9ÒS›Óˇ?j>óëÏÕøÔ ±˜≠ûRG„{£óü⁄Ãπƒ¥‘3q±#:Iπº oR“GÎsk™VÙ\p|Ó"VíB•µm¶"{ôÑ„ÙÚ ÛtOÔÓ[Ã¬ó#/zt(™ò¢pâÄ\U"/1¯=…&¡ìË¸ëÿÿZ;NØGæPƒ‰åÉMèT3%ÔEœ]Âúô∆Jv˝´DÜØN≈–M@ûtUQ˜®˜8r¡¸YXÙÅ‰⁄6& r¯¬a!Í‘
c>á´•Cﬂ‰«ÃÜÿè¸ÔÜ÷} ‡ÿÌÑﬂÕÇêJR )⁄ZÕÜΩ?4P‚%Eåç8q!˚ß∂˚≤¬Aî/î‰¨Ã‹9Ωﬁ8Ys*¢N∞ge∏‰ÈDjQ‚Ô_êÛ)÷K¡]q˙ m„}óÁiì’’”ˇ¸‚≤Òîπ„CU—r'A=/ …R§éC TjAøZ•:k¶˛Ç*oÍ¶a√eÍ£òì≤^ƒÏÕÚØ#˘ÿ◊ÖÓ≥_â-4õH´>õ§QEH:x¸)õ0¯òçCñ√Bü4≈[ú≈Ò%€yÇ8‘åÌ§I≠à3›Û#HB—U·∫}EÊl?">˙9hdGÎäI^Û‘S©
≥∑Q}ïAÎT:•™”∑§Ä}8∆&¸X+ª÷ﬂr£}Ö≠'°Ÿ∞e¡Ôqw•P-º»≤°A[Òﬁ=Yû»QÁ<á”àﬁP•÷Ë#zöå˛4r2ï≤ÏYõÕl=é∆≈z Î7ë√{Œ4HÛπ‰Ès∞∂BLcúœù£»zÁO¸ÇNÏÕiá#Î¬Ω+®{€?.Ø/oæd3·SΩ5–∞U}´ïZ¨∞ÉZfüÔ≤°⁄u«eÛrU<¨$√ S\%¬±%NÔF≠u.·¶û"“±è1Ò›í´√ö[çÔ∂8<_™ù%Xp/kÙßW0¨|0{B5”æ˝ÏáéúóÒº∞™—YsÓÆé†"·˙ ÿπ_è\\˛‰	¯ûØ&5tMgb ãGdt≤ûÖ‡ü∞6Æ<.≤˘aΩ
O£?Ë÷}Ö;"J ›˜‹´-N›c9dV|˛ΩÊÆ˙éVH∫)R˘á•J√FµT´IÓd-í◊á1¸y˜ﬂ,E%~Ù(øA3&øCoáÍ™#öìå÷R∑˙úÏ1√pÜœüÇñY˘çÔ∆ﬁÆl πrÙÖ;Òz>°cBE$s£üs#á∞m(-º¡#j…/Ã, ˝˜—W∏“¶`ÿΩÌ˘g5≤B™¡U	6ÛWO¶Go§‰Vòbu›^nbL∑Iº¨Û/π]ÄóπΩéwf3±=à|¬[˝WÎÕ©_PA[^{∏©ø	ıˇUŒüôû√8:J¡õ£Õ¸#Æ](uÿ≈áÏ™Z¥|å/∏0®∆ösé∞∑}v_¢‘ÆaÒ‡W8)iÜ1C6“–/éâhf¸«À‰ˇ™ﬂp7Ä3Ó>ï≠-oT+√`Ÿ@a¨É@aE¿‡Eè˘?ÉºüÛV;b-CM¿¸◊ûÔﬁª≤©ì∏π˜àgìaà:b|OçE-«w·à0â¬∂^|¿Z·≠˚ç
.S®π2t≈bl54Ÿ'[„JG«Å8ıó¢D˛¯|‰@º≠VŒ¢°Nå•c∆	˚xççÔÖ'ï}˚PÈr·âÌÂL„X˚Á`n¯«ÕSó>Ùíßjöb6¬áﬂpùj"©ù€=xÂŸËÀ}u-?}∏b;œñ¡>åcÓÿ˛˝ÄIÃÆ£e9q;˝éò±"¸|∞›Î$$âÃ∏≥äd◊¶}¡NÓ3‰ÖÆ\‹A– ®≈*f-h•xñÀ—#∏ï¸y≤îŸYÄV˛¨0m⁄Å1À4`ˆ´ùfpàŒrˇû√ñXµñDvñlÑπ¬2Tú@¡∆¬ﬂg–¿)„{Û)´ ±4Ñœ∑⁄gÓÙyﬁ˙z’q≠Òaq≥∏]Ê˘Õ›ÇÕ™2I=P÷∆w¨˚{'C⁄äëXrµûP]óè/è	¡R©πFj~¬:ìväû1 •ú&€—{≈Lµyƒò
ÉÏNb∏cSR–œbÖ∆≈|=5á·üTs{fC±Œ›2#*≥…¿ÿ#mg#]ædØ⁄Àx	˜ZÁñ[üsW¿Éãkh)CG‰b†º8R«xA§
ëÇòŸ*¢c`⁄ÎâÂ‘µƒe¡ÆD|I–∑àÃ2Cµ∂1mœ∂ÊÑQÿû ÒBpÍC_DŒ÷ºº#uñsBÇcÉuwπ£<SJ÷û~ˆ‡z€Iû˚¿5€ÍozC∏ü4ÓÛ@÷»nF‚wê#Q¿∫WáÍrUó ‡çƒ‘ÇDÛQo+†kjÍõÁ,ª;î†_kpP›C*G¬E1≥¯lk9î=•ª©K ŸˆIÈ‰Úπ[•9CíH™Ev⁄›<Ñü˚–÷£XÄÙÔ›€ﬁ˙4H¢∏Hä∆Ó#{Z›:¡‚Æ3aAË\£Za{=ãD0–éÃªº7–»ÇÁF∂›Z„=YÈuu™£6”X—ô: ¶èC…ZbØÓó¢^ŒŒì±¯•HÇiE˜”˝∑èSK¯˙X«ÅŒúáÀ8eÕÂ‹—∞v\BV√˝;1ﬁñp:Ôs\
rq0HhINwæ]¶ußUe›±kw–π'ªò+	B˝E?ë∆π«óçÅ@}-dg7í˛æx◊˚Ω©q#.≥˘ü( ≈Ào¬Ú8eÀ…+±éÆt`c,EóúSZ“¿YMy
§€^À∫ª”ï]qKLwn´ì>£Ÿ$%§!p:Ap”ô2=wóBI©…€ó˝(‰™;5$to+œ…è˘´∞òÒnäö∂Ÿ}≠Î(<ªˆ§û∑,#ß¿Û5n˚Pº8£´ hmxTÚŸgsjŸıî|Ûnm4ÏówC	≈Tr$‡¿Ô®‘(3Î‹E&ÎD	É†ÜóØ;|]{ä`œäy\¶)Yc|nH˙ 
˛ü
Ö^ï(Dn  -F±$i›ıhÓ•'R›⁄Ï:äJF∆¸€ﬂ~°}îx3‡m!∞és jE€›ÂÊæª	Ì¨é∫à≤Ãø≥˝ÅΩ*'!DÄ8√óE'?“ÙHBûbêY¢àÌ–Yä;ÑÜN*Û˜ Cz;^
´%µ¶˙˜ÁÛván1\¯b≤eÊ≠L”˘+•“˝x"÷ôó3ÔπÍy±	n™Tí˘ˇ¬JˇT%S@KMñäòU›è‹ks∞PK’£V'èüA˜Ë¶á:ÍúÇ ˜¥Úk≈“j_v¨ÖF#“vΩ%ç8{ç˛j˙!ıQ˝iŒ¨å⁄à^Ä8r“§¢˝<Î}‰ƒôc„€ã˛ñ¶MíﬁDg7pÈRﬂ”%˚œˆåG`¨îN‹:c›øÈZ∏√«€§[f%áR[$®|6	Æä∞çÇó≈ËgA˙e)¨?”ZmòH'M8hWvÁ\È&X„åáÜèE[Rñ÷d˛€≠∆äHmÃ—gÅ«∂‘£§∫«‚àÿâÄı≤ÇFÍ‘nj•¿l¡xˆï,0˚wJ%øuÿøB¨ÉD–
˝¯Ñ`ﬁ∏É#uö7» ﬁË}π\∞:RÅí∞¡¶öóMﬁ[ªê‘ßóso(ÌËÔd\Ò§üì‰∆w%ª˜ÎÈ»t?«8M¶¬H˘áÍ-*I⁄/◊ÌÄ∏ÑÑ ‚+éƒ~tL¯ ˚N√ﬁx¥CN[4ôyÖŒxcA‘_ßvÃ˜mDuKˇÌìdÔ£õ ®6ÂeñMuÁcàú±daª‡·Í»bæÓ0ì1˜!
wÿ·¢ı ùáL{6«*F¡•†æœ˙a–2≥„Ÿ-øÎ%Ÿz 4ÙÅ'"ü”2.ZLUP,„õGû
ﬁ=L2 `í„∫}.hÛoé≥/–è!¿√}†Õ†Ïc68	ÔoÅ
?"®ÀŸ®◊b´äCπ
^L©1Â˘‘Ö‰ù[â4§ˇd˜y}Éc^\ÛCU/`π†…ß*ô≤jî°&s∂|W2lº[:-à
25ø$q¶¿¢«@Óg≈<œ√Êæ0¿wπ÷üﬂœjW∏ùMX¯c¯À:kÔ∏?Y”mI»x(Ω Ÿ≈1Æ‚c’´Å˜ñ‹Ë8z±uŸ(®ÌÓì}FDöÌÁD_◊$
+"¡‰ﬁe§‘Íu75˜Ï
Wî÷E«ö,`“˘.E„Ï^?ˆÕSH®¬áŒ
“¬¥ÏäÄ
®ë<¨BîÜŒ|◊ƒæ¶Œ¡D‚˝—ÏhΩ√Ì8ÀJI›Û#aõ%+~
®Zà2µüÜÿ8É◊¨ˇr÷~¬€V’Ñ3P0å>$Ãc„.yÃ∂ÿ–Pà?î!÷C≈
·˚¸∫˚_ Xiú˛s¨≠j™∫'ΩDã?ˇ˚MååNIÙé!duKfï¥°`ﬂ¿Clª7«õéK.u)ÁLi≤•
«}=(xiäì‹˛ˆzáPV1<Mu∏Âw∞qêµj≤7Q”jvM'U’©µÏﬁ Ì_…¬‚qÂLπ:˛›…∂Eª®ß≈OÎnl6†l[î’ç7µò 'œ\ı¢î#\ﬂ±’@k+»˚mú¢w}òéÀ∞XGà
±Ü2¶¶CÈäsOèezœúBøΩ∞áﬁ≤{ÈúÂ≠πÛaÆ  …‚¨…9ƒ¿Í{Êﬁ["∞ πH|V˛ö«Ò tÖ|ƒΩ†≠~í`´f≈˛A(∏eŸΩ#
ú7Ô+á•ÌdÑ@g2 ßw∑¶¥ÔètDÓS6>–¥‰7ê‡Zﬂπ%”†” Î	ÃR™æc∑÷ÚJ „´€)ry˛k¡ lF◊y‹]T0Õ)%gtb,√wàB¥wƒDo
≈•äó}…ı0¢öµú˚óÅ´]$´Eÿ‹–w≈äg©ß—NΩ…#=É+s…"±±ºÃ:Â¢˝‘¯≠Ω£5FDW7Õ-4≠ÜŒß.ÅÒ}´£åF»wY∏25G;0P6@Rí±ÄUS∞‚UÉä»¢8ﬂëX Ï‚$[6.Ïq¶wGˆµ‡uœ„5E¡9œNç◊`G„.;√<Ë)Tkrªÿ »Wœˇ˝™»ìJÕ£„πo~)Åö∞	¸OÃZU*¢Fë!5°wì—ÂåBSx¬ìK„¡1}!!âÌ¥Ù´•2§WfM¸¬ıLºp˘rãINPJ‚ﬁ⁄^∫i‹ÖëÛãÿ„vG@ˇëFÇq|≠œ{à ﬁ¯ˇ(«êﬁ±J∂J¸•ã{cd! ä®÷í”áYç¿"*,ÊØ©H…^ö„L´À„W~s”;õ~è¡ÁÔ÷d
ìıÃ"R¶5≠"w¸ïëÏØ≥ØúËI[*Àq¯òπç§C˜ˆÕ_|˛∂∆kD◊ûï¢Eân5˚»[êåeÕ‰Í•Æ$Ãó\È¡¸D%¬˘≠LÅMn7rD ±uk8òg ıéŒì‹™ıiˆ∫1çôı√b3”»§t≥Ã~iNqŒº;˘lceb(˛–•TıÌ~Ñπ¸1¶ªI}ZêŸÒhÈ›Ôáı_Í∫◊î√≈•Pc±€hÕú.Yò…ˆŸcòQ Á†ˆD%x<MT—§ê¥›H¶í§@>õÉÙﬂpÍ>
ı©*ßaÖ‹t◊ãÈ:/ûR@Ã≠ djÚIÂÛpırpòP9∫A¥Åú?ªP,y{RÏH∂¿Ÿ{‹szw,J;ÉA}ì#ë› SÑ“î0Mﬁ}(æyOG∫∑í!Q~Ÿ_s)>9öã8ñY&C,5Uÿ¿>xIÒ>ÀNÕ‹Ω◊Û«üg˚“—sª|fße–j!1T«I∂Á/6AõnøUIó±™˙˚†µ‰åÆa™"Áu√Øí;Å⁄⁄>ÒÇäeOù’-ø‡MQâ†T˘Yª¬S∂Æ=BÑ∫jıäal!TW5
.¯
.i8AÇÕè¨«ı È[c˛]3Âvf¯lk†»ôÌu@ﬂ ÚÅ„G#„–¶v.BO@–∫m5™"ØçÇÄ§ß°,y≠˝lïK¬†|≥ﬂ∂Ê1∏¢«TÖ0Ë¶S"πf±ùPòﬁzÔ1?XLÁo¨%àlŸ<~‰vˆ c;¥¶Èµ·∆[Œ6œÛ*ÑOôs˘f◊tF˚∏”‡2«uÔo—àŸ6Ç"WË*ËÀ÷"≈/Í∫*¶£\÷FÂ‚Ô.ààªo°m†„Nc6ò15xl°»o‰‰ˇ-	Á’f∂z5≥H¿ﬁïxt’F€Ûíf"¬i~áGF„ƒ$MÚÁkoêåõë{ÌåW∂X∂n8)∏ZË&vi™ÿrË/4+’vòyÄ∂XEù¶n[Àu\Àﬁ‘Ô∫4y¢  ]éh√Y∆Á—6òt‹iGT»5bB8#+∞∫'∞∂DœÄ¯X†qèhy◊#ì›F46‘ìùAÒ>≠	NŸ/[æî‚®€9≈k† ãZQaZπÔ~~≈ 
±ù=¶É‚ÙŒMr"˘è9I‚™on¬q™ßíw¸¬∏a¯Ë›V}ﬁRbªaˇV•ÔwÃ}z@Ö⁄v„ê©w… «i°FÔ‹„X(¬‰°Û»>_T±ﬂ’≈ÆƒítÕ}"5ØÓà5y ¶f…ÏŸD‘åuV!*£vsNáØ2√ﬁ-$f˘G;™_'éíπ‡2R!§Ó‹„êÜFÁÁˆ∆úÓŒTÕv;RπöîË¢aÑ¿qt’}`d?¶wL‰d«ûπ„∂"ùı≤Œú2NÌåÀY*Åòhz•7Œ◊äó!´·áb…Øß¸j≈Úf*Ño≤èﬁÓtN›ºqH3o”èFÃ‚÷T˝xå,}2œ±7h‘Úû`|±zîÑóÆ[°9Ú{)¬¯}Dñ˚≈r≥#µHRv;—ΩI™œz∆^Ωûûw¬éÎ¢EliQ|ZI#=Â˝y~ÕË˙Nó®Û–∆i√ΩØÛÑä$ ÖAˇ˙VY r›È´ÑÜ⁄éœ®ÒI‰∆óD≤ã À!ÑB3sQ•T\›¥=q¡=ŸtëÎï:•âí«vm¥+5√Ñ%±z”5?¿'
≥;k/| ˘ CY5∂=ÏÚ¨>jÜ¥1~°úëøÇ!ô∏G¡’ro±Ú¬ovqRÆbªjèGZO9bàÁ?«ÈµÊÀ≤IZc∞üI‰\Œ<¬´,Óâ÷üP#Ñ˛DøŸ(ryßJ≠πq≥,Q§&q∂ã·•ÚØˆÛM‹»∂A6FE‘SGW—ì¿‚ç&¢≠´Æ;≠yVΩÙ92#d¿ˆì?Kq°ŸGÌP‘˛@√ø™∞}äíNiôñÇ%j íüƒ#$…nyÜMa∑jKÄ±H¨Rã«»≤Ÿ‘¯†v∫TbKü ]—≥‘·œ%A¸Ágc£1Î”Åv–ü·◊Z;zA´fä“´•ÅÜ∂muPìÜ®‚c\Û√«h∆Ô⁄ÜâY›˝°1º<:ZÔêgì”ÿGRÑ
îÆê˛Fª{^†å"™	"V5Ûë´Kô}2[Í› Â‹∑ìÄ!ÏêÆ{˙GN%‚lŸàËå=}I™Vq)E{Ûö:z Œ-í’˛ d•;p≥;ÆªéÊmµÃ®#π]„ÃT©éd}áLÂ*‘>£dQs*¸ÛΩ,7ß3ÚBÿ1G1Ç≥ÿ6#XxjV#é|ù5´Û©mIÛê4 öÍåèje‰0)Ö„mGs ˆÓ^:Øæ15Büc˜‹˘áÊÈòÓ≥®_ÌŸ+ßÀÉ˚ø|)ãkLﬂL pVxñX∆õl]Å∫œ∞O∑åÓ<w~´¡—Í™!fÄP/5Au†?Ÿï›zÇ”ÒÄ®o˛íÏ˝I†$–]ÃHo√R¸@HèÎy[ﬁ	çÄ]ˆ2õ¯õ57s|Å5“%ÍûZbﬁ¿ÁÎ˜»V§sb›˝≈ıì<ï∆ﬂ÷ŸJ·ÜÑºD`ƒ?Æ~}€„—∆äöõ7ŸC3≈;	äÑ”≠kWÊôî8<¶ÿMËZ,¸¢b5Bê¥eP[•?˜ÑgY√dR&Ï{;ÿ√∑ßÎ^S^7¨6‚í&	EÖπôR|’ãéúØñ%Ô¯˝æ≤ËR“©r°ˆ5kãÍv7TÀ‹â~è(k⁄e≠´]ZÓbN·¨∏õ0B∏7¨Ân¯YÀÉc;Ì¢IE¢Ï`}´Sô NnfÈ˜VrV—“qÉæ¿J8ñÀºS-∑Ã“ÑÍÄ3ã≤∫‹≠ù—Håó÷E4^í⁄√®äRœWﬂ∏0jén+ƒ@àP‰í©s	„bïòñêÜQ:ñO'∏4z°{Ÿ˙≈Ú˜ç2©Ùô_(∆‹ä=>8	Ûaƒ	√Ëaæ¡lÁ¨el…Ê¬FfãŒÑ‘w∞ñÑß˙ÅGëN7ø/Î–Ø~êEÊ;ÿë®©Ô§pâzÜﬁﬂƒ~»’id‰3GÍE≤¶‡˜4pö°∂øÈ"øÎ^èÀµåzÇŸ≥>1î∞åô TylËà «1(∆·•tÕ6∏ñ(˜üÔ
f{∆iÃ˚É!Ü§3æPûx‰ãµ‘m∑}üÈ»c@4ªÈç√ÙA	ª&ÕLa
¢ê¿›HaÍÅzU≈b}Œ1 6™¢åx=#·`Ó˝SÁÿ6ê8…'4‘°E/ﬂ$§q¿Åj@›õïÏc√´T5â}fËàe!ÏtzÇ›ò
Kµü–hÃßÓ{!¿Ö\]ÉÕΩBÁÆ};	÷´S<ﬂ¶≤ö∑p“¶,w/Ü-]÷‹¢ef≠ÃiôfwÏ´|◊˝Y“ìWò˚Í= 06Oü5ß=⁄Ò®z„>Ù¥UÖË/§ü2±M90*D=SÔEê4¡ÿì-‘ô≠◊h‰*=û⁄[aårÆ=∂&ÊXn€íÊ™áπ¨*èórÃ˚;™÷Êèd“˚*Ù⁄€ﬁèô9	¢"ïJ”CXTÜf3X∏g≥ûîÌ‘ +gKê?πyV≈åïÄJîÿ_¸Qü\¿˛ﬂ(y*6¢sÄî	Ç*Ó1o|‘yô Ø‘deZ‰´⁄U˚AöÃﬁ⁄ºÎDﬁÊn¶¨’ò±˘H#˚Næjl>˛ΩØ©¶u‘ÑÈ§ìR¥…˙ScÉ˘p,±µz≤A—º%î°…6
ü‚|¢∫yãﬁJò%Ú	~'¬£⁄Û(Jå∫Lm—µÅ∞§y‰7„ÃZÁ¡jAªq˚˘SjèüL±E£≤Ø°dƒèôP“RCäN*qE„`ß—#µÂ©ó'tP: NÏUñ»oØ⁄ÛÄk™WªΩ,äRT&1L˜ Qü(u‘ùñÌî><&Ó´ÜÒ˘…Vñ∏yfò≠Ñ¶$∂eœ≠E&¬Œ‰`Ò>"Q~»qá°(à;um,ÔÿrOId¨gKª(› ™∆Ç°–6∑ÅO˛ ﬁŸ´,ÿÓ	–ÎˇùØv@õé»“}n÷àU2˜?Ò>'∑„«““$#ﬂ[Æ≥Ò‹≈±^8xô!∑Ø
\Ë%"èŸ»kl|È≥ r…!»à=)ﬁ¬Q˝c°1·éÑﬁ∏ÛG8<Û¢PÔ5\˛	¬z¡#˙è¬0˛Y∆ ‚™Œ*`%ﬁ≠ñ'ﬂíù?8˝Å÷¢Î™>øs‡„ı~úî˜~Ò…ù÷ﬂ˚1|Á#m-õ˘8.G3<ØU&Ïh·Çà©k˙"O$O|Ç™ë¬î∆g0Ä«˛˚y¯ÜháRN›˛ùd1—œ≥¶ÃE˚∏ñê 6◊˚x´Î3æß≈˛˙‰*´˝P∫—≠è¶",3	◊ú!ÃﬂÒX¨ı\Œ?îQS~ˆ‚¨„Æ÷sËåv;˝°èˇV+EΩÆ§∫ùiß∞@ùR°ﬁ™¯¶”Ôç›¥_°ô&∞§&â∆IËíæ$6x2°®Ö
[«qÑ∫∆%;Ì7)aúUè:=˝X‚∆ª†¶˘vJa≠&fiEπÒhÓ∫±H›mKu›ôÀêT˘D—÷üãdÖ#Ä˚À⁄0ágêÿ/»jZáVjBwÖ4ßñ=VÜr©T ]∆gæ∞Ädåc^¬â8$‘~ë˚ﬂ<@—iI≈6›Ñ»ÄÜˇ|qeyjÏèÎt®AQm–Ãöûﬂ?Înïn˘-7cô¸Í®ÊçÏgêì¨V
‘ÆêÈ.TñÇÆñ·üÉt”¯î[¸¶ÑÇ J{¥ÈW`[YT ◊UŸ_5Z`èk S[œ≤à!ÂEÍ[O]–äq—5‚§Ñhø8˘Ïàë€¥¨íò2≠lï<√µ7∑\rÉqF®πä.¨Ûmb6’b9˜t{ÎÕÃÉás¨·õç¬ù~¿åﬂ¸ÿd´˙K]◊Ë¢:+^glyk°ŒÌÍ«Í%Ô6W›_Â∞5ÌÈ(‰¬äKﬁopk•kNSùˆ6†qíXkﬂ ”¡ºV¨P0TÀÿ;[¥Â|'ïç!ŒÙÇˆJIO˙*P-a~$nzVÜ)á7Ék£&´ñ´ıÜÇ¡ñ]ˇ÷ç£>£Ûw˚.v∫3[Wvçï‘0€Î≠∂‚”ø˙A,ggƒÍGc:∫¸†›û|£-H∆>Ωä≠g@≥ˇ´∏>sfC–,Æ‡‘uûæ—◊¸‹–L›ô9e™+ß¶)ß#ﬂÌ9qÙ+…∆…BKÔƒ>ÍB*V+Ï+V"É1ÓE–°{l—£,¯Y˚-w|CÌZ/!Äó∏jq‘€.ÿ˘S                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     import { SchedulerLike, OperatorFunction } from '../types';
/**
 * Emits an object containing the current value, and the time that has
 * passed between emitting the current value and the previous value, which is
 * calculated by using the provided `scheduler`'s `now()` method to retrieve
 * the current time at each emission, then calculating the difference. The `scheduler`
 * defaults to {@link asyncScheduler}, so by default, the `interval` will be in
 * milliseconds.
 *
 * <span class="informal">Convert an Observable that emits items into one that
 * emits indications of the amount of time elapsed between those emissions.</span>
 *
 * ![](timeInterval.png)
 *
 * ## Example
 *
 * Emit interval between current value with the last value
 *
 * ```ts
 * import { interval, timeInterval } from 'rxjs';
 *
 * const seconds = interval(1000);
 *
 * seconds
 *   .pipe(timeInterval())
 *   .subscribe(value => console.log(value));
 *
 * // NOTE: The values will never be this precise,
 * // intervals created with `interval` or `setInterval`
 * // are non-deterministic.
 *
 * // { value: 0, interval: 1000 }
 * // { value: 1, interval: 1000 }
 * // { value: 2, interval: 1000 }
 * ```
 *
 * @param {SchedulerLike} [scheduler] Scheduler used to get the current time.
 * @return A function that returns an Observable that emits information about
 * value and interval.
 */
export declare function timeInterval<T>(scheduler?: SchedulerLike): OperatorFunction<T, TimeInterval<T>>;
export declare class TimeInterval<T> {
    value: T;
    interval: number;
    /**
     * @deprecated Internal implementation detail, do not construct directly. Will be made an interface in v8.
     */
    constructor(value: T, interval: number);
}
//# sourceMappingURL=timeInterval.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     // @flow
// This file is generated automatically by `scripts/build/typings.js`. Please, don't change it.

export type Interval = {
  start: Date | number,
  end: Date | number,
}

export type Locale = {
  code?: string,
  formatDistance?: (...args: Array<any>) => any,
  formatRelative?: (...args: Array<any>) => any,
  localize?: {
    ordinalNumber: (...args: Array<any>) => any,
    era: (...args: Array<any>) => any,
    quarter: (...args: Array<any>) => any,
    month: (...args: Array<any>) => any,
    day: (...args: Array<any>) => any,
    dayPeriod: (...args: Array<any>) => any,
  },
  formatLong?: {
    date: (...args: Array<any>) => any,
    time: (...args: Array<any>) => any,
    dateTime: (...args: Array<any>) => any,
  },
  match?: {
    ordinalNumber: (...args: Array<any>) => any,
    era: (...args: Array<any>) => any,
    quarter: (...args: Array<any>) => any,
    month: (...args: Array<any>) => any,
    day: (...args: Array<any>) => any,
    dayPeriod: (...args: Array<any>) => any,
  },
  options?: {
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6,
    firstWeekContainsDate?: 1 | 2 | 3 | 4 | 5 | 6 | 7,
  },
}

export type Duration = {
  years?: number,
  months?: number,
  weeks?: number,
  days?: number,
  hours?: number,
  minutes?: number,
  seconds?: number,
}

export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6

type CurriedFn1<A, R> = <A>(a: A) => R

type CurriedFn2<A, B, R> = <A>(
  a: A
) => CurriedFn1<B, R> | (<A, B>(a: A, b: B) => R)

declare module.exports: CurriedFn2<
  {
    roundingMethod?: string,
    nearestTo?: number,
  },
  Date | number,
  Date
>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       INDX( 	 á}1>          (   à  Ë       €. a t ‹i d         Ì~     ê ~           9ØtôUÚ€9ØtôUÚ€,√Õ£€‹9ØtôUÚ€       }               a p p . c o m p o n e n t . s p e c . t s . t e m p l a t e       ò Ç           UtôUÚ€Ω`tôUÚ€Ê–£€‹Ω`tôUÚ€       2                a p p . c o m p o n e n t . s p e c . t s _ 1 . t e m p l a t e tôUÚ€z      x b           hËõSÚ€oì#ÆjÚ€£∫ñÛ¢€‹óÿG‹                      a p p . c o m p o n e n t . t s      ı~     à t           9ØtôUÚ 9ØtôUÚ€îzŒ£€‹9ØtôUÚ€ÿ      “               a p p . c o m p o n e n t . t s . t e m p l a t e gÚ€˜~     à x           ó˝tôUÚ€ó˝tôUÚ€≠µŒ£€‹ó˝tôUÚ€8      8               a p p . c o m p o n e n t . t s _ 1 . t e m p l a t e 	     ê |           ó˝tôUÚ€ó˝tôUÚ€€ª–£€‹ó˝tôUÚ€`      ^               a p p . c o n f i g . s e r v e r . t s . t e m p l a t e ¢€‹     ê Ä           ó˝tôUÚ€ó˝tôUÚ€‰“£€‹ó˝tôUÚ€P      O               a p p . c o n f i g . s e r v e r . t s _ 1  t e m p l a t e      Ä n                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   import { MonoTypeOperatorFunction, ObservableInput } from '../types';
/**
 * An object interface used by {@link throttle} or {@link throttleTime} that ensure
 * configuration options of these operators.
 *
 * @see {@link throttle}
 * @see {@link throttleTime}
 */
export interface ThrottleConfig {
    /**
     * If `true`, the resulting Observable will emit the first value from the source
     * Observable at the **start** of the "throttling" process (when starting an
     * internal timer that prevents other emissions from the source to pass through).
     * If `false`, it will not emit the first value from the source Observable at the
     * start of the "throttling" process.
     *
     * If not provided, defaults to: `true`.
     */
    leading?: boolean;
    /**
     * If `true`, the resulting Observable will emit the last value from the source
     * Observable at the **end** of the "throttling" process (when ending an internal
     * timer that prevents other emissions from the source to pass through).
     * If `false`, it will not emit the last value from the source Observable at the
     * end of the "throttling" process.
     *
     * If not provided, defaults to: `false`.
     */
    trailing?: boolean;
}
/**
 * Emits a value from the source Observable, then ignores subsequent source
 * values for a duration determined by another Observable, then repeats this
 * process.
 *
 * <span class="informal">It's like {@link throttleTime}, but the silencing
 * duration is determined by a second Observable.</span>
 *
 * ![](throttle.svg)
 *
 * `throttle` emits the source Observable values on the output Observable
 * when its internal timer is disabled, and ignores source values when the timer
 * is enabled. Initially, the timer is disabled. As soon as the first source
 * value arrives, it is forwarded to the output Observable, and then the timer
 * is enabled by calling the `durationSelector` function with the source value,
 * which returns the "duration" Observable. When the duration Observable emits a
 * value, the timer is disabled, and this process repeats for the
 * next source value.
 *
 * ## Example
 *
 * Emit clicks at a rate of at most one click per second
 *
 * ```ts
 * import { fromEvent, throttle, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(throttle(() => interval(1000)));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link debounce}
 * @see {@link delayWhen}
 * @see {@link sample}
 * @see {@link throttleTime}
 *
 * @param durationSelector A function that receives a value from the source
 * Observable, for computing the silencing duration for each source value,
 * returned as an `ObservableInput`.
 * @param config A configuration object to define `leading` and `trailing`
 * behavior. Defaults to `{ leading: true, trailing: false }`.
 * @return A function that returns an Observable that performs the throttle
 * operation to limit the rate of emissions from the source.
 */
export declare function throttle<T>(durationSelector: (value: T) => ObservableInput<any>, config?: ThrottleConfig): MonoTypeOperatorFunction<T>;
//# sourceMappingURL=throttle.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           import { MonoTypeOperatorFunction } from '../types';
/**
 * If the source observable completes without emitting a value, it will emit
 * an error. The error will be created at that time by the optional
 * `errorFactory` argument, otherwise, the error will be {@link EmptyError}.
 *
 * ![](throwIfEmpty.png)
 *
 * ## Example
 *
 * Throw an error if the document wasn't clicked within 1 second
 *
 * ```ts
 * import { fromEvent, takeUntil, timer, throwIfEmpty } from 'rxjs';
 *
 * const click$ = fromEvent(document, 'click');
 *
 * click$.pipe(
 *   takeUntil(timer(1000)),
 *   throwIfEmpty(() => new Error('The document was not clicked within 1 second'))
 * )
 * .subscribe({
 *   next() {
 *    console.log('The document was clicked');
 *   },
 *   error(err) {
 *     console.error(err.message);
 *   }
 * });
 * ```
 *
 * @param errorFactory A factory function called to produce the
 * error to be thrown when the source observable completes without emitting a
 * value.
 * @return A function that returns an Observable that throws an error if the
 * source Observable completed without emitting.
 */
export declare function throwIfEmpty<T>(errorFactory?: () => any): MonoTypeOperatorFunction<T>;
//# sourceMappingURL=throwIfEmpty.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      import { Observable } from '../Observable';
import { Unsubscribable, ObservableInput, ObservedValueOf } from '../types';
/**
 * Creates an Observable that uses a resource which will be disposed at the same time as the Observable.
 *
 * <span class="informal">Use it when you catch yourself cleaning up after an Observable.</span>
 *
 * `using` is a factory operator, which accepts two functions. First function returns a disposable resource.
 * It can be an arbitrary object that implements `unsubscribe` method. Second function will be injected with
 * that object and should return an Observable. That Observable can use resource object during its execution.
 * Both functions passed to `using` will be called every time someone subscribes - neither an Observable nor
 * resource object will be shared in any way between subscriptions.
 *
 * When Observable returned by `using` is subscribed, Observable returned from the second function will be subscribed
 * as well. All its notifications (nexted values, completion and error events) will be emitted unchanged by the output
 * Observable. If however someone unsubscribes from the Observable or source Observable completes or errors by itself,
 * the `unsubscribe` method on resource object will be called. This can be used to do any necessary clean up, which
 * otherwise would have to be handled by hand. Note that complete or error notifications are not emitted when someone
 * cancels subscription to an Observable via `unsubscribe`, so `using` can be used as a hook, allowing you to make
 * sure that all resources which need to exist during an Observable execution will be disposed at appropriate time.
 *
 * @see {@link defer}
 *
 * @param {function(): ISubscription} resourceFactory A function which creates any resource object
 * that implements `unsubscribe` method.
 * @param {function(resource: ISubscription): Observable<T>} observableFactory A function which
 * creates an Observable, that can use injected resource object.
 * @return {Observable<T>} An Observable that behaves the same as Observable returned by `observableFactory`, but
 * which - when completed, errored or unsubscribed - will also call `unsubscribe` on created resource object.
 */
export declare function using<T extends ObservableInput<any>>(resourceFactory: () => Unsubscribable | void, observableFactory: (resource: Unsubscribable | void) => T | void): Observable<ObservedValueOf<T>>;
//# sourceMappingURL=using.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   {
  "name": "user-management",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "api": "json-server --watch db.json --port 3000"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^19.2.14",
    "@angular/common": "^19.2.0",
    "@angular/compiler": "^19.2.0",
    "@angular/core": "^19.2.0",
    "@angular/forms": "^19.2.0",
    "@angular/platform-browser": "^19.2.0",
    "@angular/platform-browser-dynamic": "^19.2.0",
    "@angular/router": "^19.2.0",
    "bootstrap": "^5.3.6",
    "date-fns": "^4.1.0",
    "ng-multiselect-dropdown": "^1.0.0",
    "ngx-spinner": "^19.0.0",
    "ngx-toastr": "^19.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^19.2.12",
    "@angular/cli": "^19.2.12",
    "@angular/compiler-cli": "^19.2.0",
    "@types/jasmine": "~5.1.0",
    "jasmine-core": "~5.6.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.7.2"
  }
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            import { WebSocketSubject, WebSocketSubjectConfig } from './WebSocketSubject';
/**
 * Wrapper around the w3c-compatible WebSocket object provided by the browser.
 *
 * <span class="informal">{@link Subject} that communicates with a server via WebSocket</span>
 *
 * `webSocket` is a factory function that produces a `WebSocketSubject`,
 * which can be used to make WebSocket connection with an arbitrary endpoint.
 * `webSocket` accepts as an argument either a string with url of WebSocket endpoint, or an
 * {@link WebSocketSubjectConfig} object for providing additional configuration, as
 * well as Observers for tracking lifecycle of WebSocket connection.
 *
 * When `WebSocketSubject` is subscribed, it attempts to make a socket connection,
 * unless there is one made already. This means that many subscribers will always listen
 * on the same socket, thus saving resources. If however, two instances are made of `WebSocketSubject`,
 * even if these two were provided with the same url, they will attempt to make separate
 * connections. When consumer of a `WebSocketSubject` unsubscribes, socket connection is closed,
 * only if there are no more subscribers still listening. If after some time a consumer starts
 * subscribing again, connection is reestablished.
 *
 * Once connection is made, whenever a new message comes from the server, `WebSocketSubject` will emit that
 * message as a value in the stream. By default, a message from the socket is parsed via `JSON.parse`. If you
 * want to customize how deserialization is handled (if at all), you can provide custom `resultSelector`
 * function in {@link WebSocketSubject}. When connection closes, stream will complete, provided it happened without
 * any errors. If at any point (starting, maintaining or closing a connection) there is an error,
 * stream will also error with whatever WebSocket API has thrown.
 *
 * By virtue of being a {@link Subject}, `WebSocketSubject` allows for receiving and sending messages from the server. In order
 * to communicate with a connected endpoint, use `next`, `error` and `complete` methods. `next` sends a value to the server, so bear in mind
 * that this value will not be serialized beforehand. Because of This, `JSON.stringify` will have to be called on a value by hand,
 * before calling `next` with a result. Note also that if at the moment of nexting value
 * there is no socket connection (for example no one is subscribing), those values will be buffered, and sent when connection
 * is finally established. `complete` method closes socket connection. `error` does the same,
 * as well as notifying the server that something went wrong via status code and string with details of what happened.
 * Since status code is required in WebSocket API, `WebSocketSubject` does not allow, like regular `Subject`,
 * arbitrary values being passed to the `error` method. It needs to be called with an object that has `code`
 * property with status code number and optional `reason` property with string describing details
 * of an error.
 *
 * Calling `next` does not affect subscribers of `WebSocketSubject` - they have no
 * information that something was sent to the server (unless of course the server
 * responds somehow to a message). On the other hand, since calling `complete` triggers
 * an attempt to close socket connection. If that connection is closed without any errors, stream will
 * complete, thus notifying all subscribers. And since calling `error` closes
 * socket connection as well, just with a different status code for the server, if closing itself proceeds
 * without errors, subscribed Observable will not error, as one might expect, but complete as usual. In both cases
 * (calling `complete` or `error`), if process of closing socket connection results in some errors, *then* stream
 * will error.
 *
 * **Multiplexing**
 *
 * `WebSocketSubject` has an additional operator, not found in other Subjects. It is called `multiplex` and it is
 * used to simulate opening several socket connections, while in reality maintaining only one.
 * For example, an application has both chat panel and real-time notifications about sport news. Since these are two distinct functions,
 * it would make sense to have two separate connections for each. Perhaps there could even be two separate services with WebSocket
 * endpoints, running on separate machines with only GUI combining them together. Having a socket connection
 * for each functionality could become too resource expensive. It is a common pattern to have single
 * WebSocket endpoint that acts as a gateway for the other services (in this case chat and sport news services).
 * Even though there is a single connection in a client app, having the ability to manipulate streams as if it
 * were two separate sockets is desirable. This eliminates manually registering and unregistering in a gateway for
 * given service and filter out messages of interest. This is exactly what `multiplex` method is for.
 *
 * Method accepts three parameters. First two are functions returning subscription and unsubscription messages
 * respectively. These are messages that will be sent to the server, whenever consumer of resulting Observable
 * subscribes and unsubscribes. Server can use them to verify that some kind of messages should start or stop
 * being forwarded to the client. In case of the above example application, after getting subscription message with proper identifier,
 * gateway server can decide that it should connect to real sport news service and start forwarding messages from it.
 * Note that both messages will be sent as returned by the functions, they are by default serialized using JSON.stringify, just
 * as messages pushed via `next`. Also bear in mind that these messages will be sent on *every* subscription and
 * unsubscription. This is potentially dangerous, because one consumer of an Observable may unsubscribe and the server
 * might stop sending messages, since it got unsubscription message. This needs to be handled
 * on the server or using {@link publish} on a Observable returned from 'multiplex'.
 *
 * Last argument to `multiplex` is a `messageFilter` function which should return a boolean. It is used to filter out messages
 * sent by the server to only those that belong to simulated WebSocket stream. For example, server might mark these
 * messages with some kind of string identifier on a message object and `messageFilter` would return `true`
 * if there is such identifier on an object emitted by the socket. Messages which returns `false` in `messageFilter` are simply skipped,
 * and are not passed down the stream.
 *
 * Return value of `multiplex` is an Observable with messages incoming from emulated socket connection. Note that this
 * is not a `WebSocketSubject`, so calling `next` or `multiplex` again will fail. For pushing values to the
 * server, use root `WebSocketSubject`.
 *
 * ## Examples
 *
 * Listening for messages from the server
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const subject = webSocket('ws://localhost:8081');
 *
 * subject.subscribe({
 *   next: msg => console.log('message received: ' + msg), // Called whenever there is a message from the server.
 *   error: err => console.log(err), // Called if at any point WebSocket API signals some kind of error.
 *   complete: () => console.log('complete') // Called when connection is closed (for whatever reason).
 *  });
 * ```
 *
 * Pushing messages to the server
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const subject = webSocket('ws://localhost:8081');
 *
 * subject.subscribe();
 * // Note that at least one consumer has to subscribe to the created subject - otherwise "nexted" values will be just buffered and not sent,
 * // since no connection was established!
 *
 * subject.next({ message: 'some message' });
 * // This will send a message to the server once a connection is made. Remember value is serialized with JSON.stringify by default!
 *
 * subject.complete(); // Closes the connection.
 *
 * subject.error({ code: 4000, reason: 'I think our app just broke!' });
 * // Also closes the connection, but let's the server know that this closing is caused by some error.
 * ```
 *
 * Multiplexing WebSocket
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const subject = webSocket('ws://localhost:8081');
 *
 * const observableA = subject.multiplex(
 *   () => ({ subscribe: 'A' }), // When server gets this message, it will start sending messages for 'A'...
 *   () => ({ unsubscribe: 'A' }), // ...and when gets this one, it will stop.
 *   message => message.type === 'A' // If the function returns `true` message is passed down the stream. Skipped if the function returns false.
 * );
 *
 * const observableB = subject.multiplex( // And the same goes for 'B'.
 *   () => ({ subscribe: 'B' }),
 *   () => ({ unsubscribe: 'B' }),
 *   message => message.type === 'B'
 * );
 *
 * const subA = observableA.subscribe(messageForA => console.log(messageForA));
 * // At this moment WebSocket connection is established. Server gets '{"subscribe": "A"}' message and starts sending messages for 'A',
 * // which we log here.
 *
 * const subB = observableB.subscribe(messageForB => console.log(messageForB));
 * // Since we already have a connection, we just send '{"subscribe": "B"}' message to the server. It starts sending messages for 'B',
 * // which we log here.
 *
 * subB.unsubscribe();
 * // Message '{"unsubscribe": "B"}' is sent to the server, which stops sending 'B' messages.
 *
 * subA.unsubscribe();
 * // Message '{"unsubscribe": "A"}' makes the server stop sending messages for 'A'. Since there is no more subscribers to root Subject,
 * // socket connection closes.
 * ```
 *
 * @param {string|WebSocketSubjectConfig} urlConfigOrSource The WebSocket endpoint as an url or an object with
 * configuration and additional Observers.
 * @return {WebSocketSubject} Subject which allows to both send and receive messages via WebSocket connection.
 */
export declare function webSocket<T>(urlConfigOrSource: string | WebSocketSubjectConfig<T>): WebSocketSubject<T>;
//# sourceMappingURL=webSocket.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         import { asyncScheduler } from '../scheduler/async';
import { MonoTypeOperatorFunction, SchedulerLike, OperatorFunction, ObservableInput, ObservedValueOf } from '../types';
import { isValidDate } from '../util/isDate';
import { Subscription } from '../Subscription';
import { operate } from '../util/lift';
import { Observable } from '../Observable';
import { innerFrom } from '../observable/innerFrom';
import { createErrorClass } from '../util/createErrorClass';
import { createOperatorSubscriber } from './OperatorSubscriber';
import { executeSchedule } from '../util/executeSchedule';

export interface TimeoutConfig<T, O extends ObservableInput<unknown> = ObservableInput<T>, M = unknown> {
  /**
   * The time allowed between values from the source before timeout is triggered.
   */
  each?: number;

  /**
   * The relative time as a `number` in milliseconds, or a specific time as a `Date` object,
   * by which the first value must arrive from the source before timeout is triggered.
   */
  first?: number | Date;

  /**
   * The scheduler to use with time-related operations within this operator. Defaults to {@link asyncScheduler}
   */
  scheduler?: SchedulerLike;

  /**
   * A factory used to create observable to switch to when timeout occurs. Provides
   * a {@link TimeoutInfo} about the source observable's emissions and what delay or
   * exact time triggered the timeout.
   */
  with?: (info: TimeoutInfo<T, M>) => O;

  /**
   * Optional additional metadata you can provide to code that handles
   * the timeout, will be provided through the {@link TimeoutError}.
   * This can be used to help identify the source of a timeout or pass along
   * other information related to the timeout.
   */
  meta?: M;
}

export interface TimeoutInfo<T, M = unknown> {
  /** Optional metadata that was provided to the timeout configuration. */
  readonly meta: M;
  /** The number of messages seen before the timeout */
  readonly seen: number;
  /** The last message seen */
  readonly lastValue: T | null;
}

/**
 * An error emitted when a timeout occurs.
 */
export interface TimeoutError<T = unknown, M = unknown> extends Error {
  /**
   * The information provided to the error by the timeout
   * operation that created the error. Will be `null` if
   * used directly in non-RxJS code with an empty constructor.
   * (Note that using this constructor directly is not recommended,
   * you should create your own errors)
   */
  info: TimeoutInfo<T, M> | null;
}

export interface TimeoutErrorCtor {
  /**
   * @deprecated Internal implementation detail. Do not construct error instances.
   * Cannot be tagged as internal: https://github.com/ReactiveX/rxjs/issues/6269
   */
  new <T = unknown, M = unknown>(info?: TimeoutInfo<T, M>): TimeoutError<T, M>;
}

/**
 * An error thrown by the {@link timeout} operator.
 *
 * Provided so users can use as a type and do quality comparisons.
 * We recommend you do not subclass this or create instances of this class directly.
 * If you have need of a error representing a timeout, you should
 * create your own error class and use that.
 *
 * @see {@link timeout}
 *
 * @class TimeoutError
 */
export const TimeoutError: TimeoutErrorCtor = createErrorClass(
  (_super) =>
    function TimeoutErrorImpl(this: any, info: TimeoutInfo<any> | null = null) {
      _super(this);
      this.message = 'Timeout has occurred';
      this.name = 'TimeoutError';
      this.info = info;
    }
);

/**
 * If `with` is provided, this will return an observable that will switch to a different observable if the source
 * does not push values within the specified time parameters.
 *
 * <span class="informal">The most flexible option for creating a timeout behavior.</span>
 *
 * The first thing to know about the configuration is if you do not provide a `with` property to the configuration,
 * when timeout conditions are met, this operator will emit a {@link TimeoutError}. Otherwise, it will use the factory
 * function provided by `with`, and switch your subscription to the result of that. Timeout conditions are provided by
 * the settings in `first` and `each`.
 *
 * The `first` property can be either a `Date` for a specific time, a `number` for a time period relative to the
 * point of subscription, or it can be skipped. This property is to check timeout conditions for the arrival of
 * the first value from the source _only_. The timings of all subsequent values  from the source will be checked
 * against the time period provided by `each`, if it was provided.
 *
 * The `each` property can be either a `number` or skipped. If a value for `each` is provided, it represents the amount of
 * time the resulting observable will wait between the arrival of values from the source before timing out. Note that if
 * `first` is _not_ provided, the value from `each` will be used to check timeout conditions for the arrival of the first
 * value and all subsequent values. If `first` _is_ provided, `each` will only be use to check all values after the first.
 *
 * ## Examples
 *
 * Emit a custom error if there is too much time between values
 *
 * ```ts
 * import { interval, timeout, throwError } from 'rxjs';
 *
 * class CustomTimeoutError extends Error {
 *   constructor() {
 *     super('It was too slow');
 *     this.name = 'CustomTimeoutError';
 *   }
 * }
 *
 * const slow$ = interval(900);
 *
 * slow$.pipe(
 *   timeout({
 *     each: 1000,
 *     with: () => throwError(() => new CustomTimeoutError())
 *   })
 * )
 * .subscribe({
 *   error: console.error
 * });
 * ```
 *
 * Switch to a faster observable if your source is slow.
 *
 * ```ts
 * import { interval, timeout } from 'rxjs';
 *
 * const slow$ = interval(900);
 * const fast$ = interval(500);
 *
 * slow$.pipe(
 *   timeout({
 *     each: 1000,
 *     with: () => fast$,
 *   })
 * )
 * .subscribe(console.log);
 * ```
 * @param config The configuration for the timeout.
 */
export function timeout<T, O extends ObservableInput<unknown>, M = unknown>(
  config: TimeoutConfig<T, O, M> & { with: (info: TimeoutInfo<T, M>) => O }
): OperatorFunction<T, T | ObservedValueOf<O>>;

/**
 * Returns an observable that will error or switch to a different observable if the source does not push values
 * within the specified time parameters.
 *
 * <span class="informal">The most flexible option for creating a timeout behavior.</span>
 *
 * The first thing to know about the configuration is if you do not provide a `with` property to the configuration,
 * when timeout conditions are met, this operator will emit a {@link TimeoutError}. Otherwise, it will use the factory
 * function provided by `with`, and switch your subscription to the result of that. Timeout conditions are provided by
 * the settings in `first` and `each`.
 *
 * The `first` property can be either a `Date` for a specific time, a `number` for a time period relative to the
 * point of subscription, or it can be skipped. This property is to check timeout conditions for the arrival of
 * the first value from the source _only_. The timings of all subsequent values  from the source will be checked
 * against the time period provided by `each`, if it was provided.
 *
 * The `each` property can be either a `number` or skipped. If a value for `each` is provided, it represents the amount of
 * time the resulting observable will wait between the arrival of values from the source before timing out. Note that if
 * `first` is _not_ provided, the value from `each` will be used to check timeout conditions for the arrival of the first
 * value and all subsequent values. If `first` _is_ provided, `each` will only be use to check all values after the first.
 *
 * ### Handling TimeoutErrors
 *
 * If no `with` property was provided, subscriptions to the resulting observable may emit an error of {@link TimeoutError}.
 * The timeout error provides useful information you can examine when you're handling the error. The most common way to handle
 * the error would be with {@link catchError}, although you could use {@link tap} or just the error handler in your `subscribe` call
 * directly, if your error handling is only a side effect (such as notifying the user, or logging).
 *
 * In this case, you would check the error for `instanceof TimeoutError` to validate that the error was indeed from `timeout`, and
 * not from some other source. If it's not from `timeout`, you should probably rethrow it if you're in a `catchError`.
 *
 * ## Examples
 *
 * Emit a {@link TimeoutError} if the first value, and _only_ the first value, does not arrive within 5 seconds
 *
 * ```ts
 * import { interval, timeout } from 'rxjs';
 *
 * // A random interval that lasts between 0 and 10 seconds per tick
 * const source$ = interval(Math.round(Math.random() * 10_000));
 *
 * source$.pipe(
 *   timeout({ first: 5_000 })
 * )
 * .subscribe({
 *   next: console.log,
 *   error: console.error
 * });
 * ```
 *
 * Emit a {@link TimeoutError} if the source waits longer than 5 seconds between any two values or the first value
 * and subscription.
 *
 * ```ts
 * import { timer, timeout, expand } from 'rxjs';
 *
 * const getRandomTime = () => Math.round(Math.random() * 10_000);
 *
 * // An observable that waits a random amount of time between each delivered value
 * const source$ = timer(getRandomTime())
 *   .pipe(expand(() => timer(getRandomTime())));
 *
 * source$
 *   .pipe(timeout({ each: 5_000 }))
 *   .subscribe({
 *     next: console.log,
 *     error: console.error
 *   });
 * ```
 *
 * Emit a {@link TimeoutError} if the source does not emit before 7 seconds, _or_ if the source waits longer than
 * 5 seconds between any two values after the first.
 *
 * ```ts
 * import { timer, timeout, expand } from 'rxjs';
 *
 * const getRandomTime = () => Math.round(Math.random() * 10_000);
 *
 * // An observable that waits a random amount of time between each delivered value
 * const source$ = timer(getRandomTime())
 *   .pipe(expand(() => timer(getRandomTime())));
 *
 * source$
 *   .pipe(timeout({ first: 7_000, each: 5_000 }))
 *   .subscribe({
 *     next: console.log,
 *     error: console.error
 *   });
 * ```
 */
export function timeout<T, M = unknown>(config: Omit<TimeoutConfig<T, any, M>, 'with'>): OperatorFunction<T, T>;

/**
 * Returns an observable that will error if the source does not push its first value before the specified time passed as a `Date`.
 * This is functionally the same as `timeout({ first: someDate })`.
 *
 * <span class="informal">Errors if the first value doesn't show up before the given date and time</span>
 *
 * ![](timeout.png)
 *
 * @param first The date to at which the resulting observable will timeout if the source observable
 * does not emit at least one value.
 * @param scheduler The scheduler to use. Defaults to {@link asyncScheduler}.
 */
export function timeout<T>(first: Date, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>;

/**
 * Returns an observable that will error if the source does not push a value within the specified time in milliseconds.
 * This is functionally the same as `timeout({ each: milliseconds })`.
 *
 * <span class="informal">Errors if it waits too long between any value</span>
 *
 * ![](timeout.png)
 *
 * @param each The time allowed between each pushed value from the source before the resulting observable
 * will timeout.
 * @param scheduler The scheduler to use. Defaults to {@link asyncScheduler}.
 */
export function timeout<T>(each: number, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T>;

/**
 *
 * Errors if Observable does not emit a value in given time span.
 *
 * <span class="informal">Timeouts on Observable that doesn't emit values fast enough.</span>
 *
 * ![](timeout.png)
 *
 * @see {@link timeoutWith}
 *
 * @return A function that returns an Observable that mirrors behaviour of the
 * source Observable, unless timeout happens when it throws an error.
 */
export function timeout<T, O extends ObservableInput<any>, M>(
  config: number | Date | TimeoutConfig<T, O, M>,
  schedulerArg?: SchedulerLike
): OperatorFunction<T, T | ObservedValueOf<O>> {
  // Intentionally terse code.
  // If the first argument is a valid `Date`, then we use it as the `first` config.
  // Otherwise, if the first argument is a `number`, then we use it as the `each` config.
  // Otherwise, it can be assumed the first argument is the configuration object itself, and
  // we destructure that into what we're going to use, setting important defaults as we do.
  // NOTE: The default for `scheduler` will be the `scheduler` argument if it exists, or
  // it will default to the `asyncScheduler`.
  const {
    first,
    each,
    with: _with = timeoutErrorFactory,
    scheduler = schedulerArg ?? asyncScheduler,
    meta = null!,
  } = (isValidDate(config) ? { first: config } : typeof config === 'number' ? { each: config } : config) as TimeoutConfig<T, O, M>;

  if (first == null && each == null) {
    // Ensure timeout was provided at runtime.
    throw new TypeError('No timeout provided.');
  }

  return operate((source, subscriber) => {
    // This subscription encapsulates our subscription to the
    // source for this operator. We're capturing it separately,
    // because if there is a `with` observable to fail over to,
    // we want to unsubscribe from our original subscription, and
    // hand of the subscription to that one.
    let originalSourceSubscription: Subscription;
    // The subscription for our timeout timer. This changes
    // every time we get a new value.
    let timerSubscription: Subscription;
    // A bit of state we pass to our with and error factories to
    // tell what the last value we saw was.
    let lastValue: T | null = null;
    // A bit of state we pass to the with and error factories to
    // tell how many values we have seen so far.
    let seen = 0;
    const startTimer = (delay: number) => {
      timerSubscription = executeSchedule(
        subscriber,
        scheduler,
        () => {
          try {
            originalSourceSubscription.unsubscribe();
            innerFrom(
              _with!({
                meta,
                lastValue,
                seen,
              })
            ).subscribe(subscriber);
          } catch (err) {
            subscriber.error(err);
          }
        },
        delay
      );
    };

    originalSourceSubscription = source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (value: T) => {
          // clear the timer so we can emit and start another one.
          timerSubscription?.unsubscribe();
          seen++;
          // Emit
          subscriber.next((lastValue = value));
          // null | undefined are both < 0. Thanks, JavaScript.
          each! > 0 && startTimer(each!);
        },
        undefined,
        undefined,
        () => {
          if (!timerSubscription?.closed) {
            timerSubscription?.unsubscribe();
          }
          // Be sure not to hold the last value in memory after unsubscription
          // it could be quite large.
          lastValue = null;
        }
      )
    );

    // Intentionally terse code.
    // If we've `seen` a value, that means the "first" clause was met already, if it existed.
    //   it also means that a timer was already started for "each" (in the next handler above).
    // If `first` was provided, and it's a number, then use it.
    // If `first` was provided and it's not a number, it's a Date, and we get the difference between it and "now".
    // If `first` was not provided at all, then our first timer will be the value from `each`.
    !seen && startTimer(first != null ? (typeof first === 'number' ? first : +first - scheduler!.now()) : each!);
  });
}

/**
 * The default function to use to emit an error when timeout occurs and a `with` function
 * is not specified.
 * @param info The information about the timeout to pass along to the error
 */
function timeoutErrorFactory(info: TimeoutInfo<any>): Observable<never> {
  throw new TimeoutError(info);
}
                                                                                                                                                                                                                                                                                                                                                                                                import { AnonymousSubject } from '../../Subject';
import { Observable } from '../../Observable';
import { Operator } from '../../Operator';
import { Observer, NextObserver } from '../../types';
/**
 * WebSocketSubjectConfig is a plain Object that allows us to make our
 * webSocket configurable.
 *
 * <span class="informal">Provides flexibility to {@link webSocket}</span>
 *
 * It defines a set of properties to provide custom behavior in specific
 * moments of the socket's lifecycle. When the connection opens we can
 * use `openObserver`, when the connection is closed `closeObserver`, if we
 * are interested in listening for data coming from server: `deserializer`,
 * which allows us to customize the deserialization strategy of data before passing it
 * to the socket client. By default, `deserializer` is going to apply `JSON.parse` to each message coming
 * from the Server.
 *
 * ## Examples
 *
 * **deserializer**, the default for this property is `JSON.parse` but since there are just two options
 * for incoming data, either be text or binary data. We can apply a custom deserialization strategy
 * or just simply skip the default behaviour.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   //Apply any transformation of your choice.
 *   deserializer: ({ data }) => data
 * });
 *
 * wsSubject.subscribe(console.log);
 *
 * // Let's suppose we have this on the Server: ws.send('This is a msg from the server')
 * //output
 * //
 * // This is a msg from the server
 * ```
 *
 * **serializer** allows us to apply custom serialization strategy but for the outgoing messages.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   // Apply any transformation of your choice.
 *   serializer: msg => JSON.stringify({ channel: 'webDevelopment', msg: msg })
 * });
 *
 * wsSubject.subscribe(() => subject.next('msg to the server'));
 *
 * // Let's suppose we have this on the Server:
 * //   ws.on('message', msg => console.log);
 * //   ws.send('This is a msg from the server');
 * // output at server side:
 * //
 * // {"channel":"webDevelopment","msg":"msg to the server"}
 * ```
 *
 * **closeObserver** allows us to set a custom error when an error raises up.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   closeObserver: {
 *     next() {
 *       const customError = { code: 6666, reason: 'Custom evil reason' }
 *       console.log(`code: ${ customError.code }, reason: ${ customError.reason }`);
 *     }
 *   }
 * });
 *
 * // output
 * // code: 6666, reason: Custom evil reason
 * ```
 *
 * **openObserver**, Let's say we need to make some kind of init task before sending/receiving msgs to the
 * webSocket or sending notification that the connection was successful, this is when
 * openObserver is useful for.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   openObserver: {
 *     next: () => {
 *       console.log('Connection ok');
 *     }
 *   }
 * });
 *
 * // output
 * // Connection ok
 * ```
 */
export interface WebSocketSubjectConfig<T> {
    /** The url of the socket server to connect to */
    url: string;
    /** The protocol to use to connect */
    protocol?: string | Array<string>;
    /** @deprecated Will be removed in v8. Use {@link deserializer} instead. */
    resultSelector?: (e: MessageEvent) => T;
    /**
     * A serializer used to create messages from passed values before the
     * messages are sent to the server. Defaults to JSON.stringify.
     */
    serializer?: (value: T) => WebSocketMessage;
    /**
     * A deserializer used for messages arriving on the socket from the
     * server. Defaults to JSON.parse.
     */
    deserializer?: (e: MessageEvent) => T;
    /**
     * An Observer that watches when open events occur on the underlying web socket.
     */
    openObserver?: NextObserver<Event>;
    /**
     * An Observer that watches when close events occur on the underlying web socket
     */
    closeObserver?: NextObserver<CloseEvent>;
    /**
     * An Observer that watches when a close is about to occur due to
     * unsubscription.
     */
    closingObserver?: NextObserver<void>;
    /**
     * A WebSocket constructor to use. This is useful for situations like using a
     * WebSocket impl in Node (WebSocket is a DOM API), or for mocking a WebSocket
     * for testing purposes
     */
    WebSocketCtor?: {
        new (url: string, protocols?: string | string[]): WebSocket;
    };
    /** Sets the `binaryType` property of the underlying WebSocket. */
    binaryType?: 'blob' | 'arraybuffer';
}
export declare type WebSocketMessage = string | ArrayBuffer | Blob | ArrayBufferView;
export declare class WebSocketSubject<T> extends AnonymousSubject<T> {
    private _config;
    private _socket;
    constructor(urlConfigOrSource: string | WebSocketSubjectConfig<T> | Observable<T>, destination?: Observer<T>);
    /** @deprecated Internal implementation detail, do not use directly. Will be made internal in v8. */
    lift<R>(operator: Operator<T, R>): WebSocketSubject<R>;
    private _resetState;
    /**
     * Creates an {@link Observable}, that when subscribed to, sends a message,
     * defined by the `subMsg` function, to the server over the socket to begin a
     * subscription to data over that socket. Once data arrives, the
     * `messageFilter` argument will be used to select the appropriate data for
     * the resulting Observable. When finalization occurs, either due to
     * unsubscription, completion, or error, a message defined by the `unsubMsg`
     * argument will be sent to the server over the WebSocketSubject.
     *
     * @param subMsg A function to generate the subscription message to be sent to
     * the server. This will still be processed by the serializer in the
     * WebSocketSubject's config. (Which defaults to JSON serialization)
     * @param unsubMsg A function to generate the unsubscription message to be
     * sent to the server at finalization. This will still be processed by the
     * serializer in the WebSocketSubject's config.
     * @param messageFilter A predicate for selecting the appropriate messages
     * from the server for the output stream.
     */
    multiplex(subMsg: () => any, unsubMsg: () => any, messageFilter: (value: T) => boolean): Observable<T>;
    private _connectSocket;
    unsubscribe(): void;
}
//# sourceMappingURL=WebSocketSubject.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    INDX( 	 2:>          (   ∏  Ë       _ ‹ g € €        #     p \           Ãﬁ≤O≤€€‚,≥O≤€€Zz£€‹£®£f“‹       T               r e g i s t e r . d . t s    F     p `           {≥O≤€€¢≥O≤€€ıÏ{£€‹ÿu”§f“‹–      Ã               r e g i s t e r . d _ 1 . t s O)     x b           Më˚«≠´‹áT¸«≠´‹âXö£€‹áT¸«≠´‹‡      ﬂ               r e g i s t e r . d _ 1 0 . t s      /     p `           £¥O≤€€PµO≤€€kä£€‹sSh§f“‹Ä      y               r e g i s t e r . d  2 . t s ç     p `           [>µO≤€€qeµO≤€€>ôé£€‹ËÂ5•f“‹       T               r e g i s t e r . d _ 3 . t s ï     p `           °⁄µO≤€€Ø∂O≤€€Å	è£€‹Ôú”§f“‹–      Ã               r e g i s t e r . d _ 4 . t s «     p `           ´∑O≤€€ )∑O≤€€©[°£€‹%h`§f“‹Ä      y                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      import { OnDestroy, OnInit, OnChanges, SimpleChange, ChangeDetectorRef, ElementRef } from "@angular/core";
import { NgxSpinnerService } from "./ngx-spinner.service";
import { Subject } from "rxjs";
import { Size, NgxSpinner } from "./ngx-spinner.enum";
import { NgxSpinnerConfig } from "./config";
import * as i0 from "@angular/core";
export declare class NgxSpinnerComponent implements OnDestroy, OnInit, OnChanges {
    private spinnerService;
    private changeDetector;
    private elementRef;
    private globalConfig;
    /**
     * To set backdrop color
     * Only supports RGBA color format
     * @memberof NgxSpinnerComponent
     */
    bdColor: string;
    /**
     * To set spinner size
     *
     * @memberof NgxSpinnerComponent
     */
    size: Size;
    /**
     * To set spinner color(DEFAULTS.SPINNER_COLOR)
     *
     * @memberof NgxSpinnerComponent
     */
    color: string;
    /**
     * To set type of spinner
     *
     * @memberof NgxSpinnerComponent
     */
    type: string;
    /**
     * To toggle fullscreen mode
     *
     * @memberof NgxSpinnerComponent
     */
    fullScreen: boolean;
    /**
     * Spinner name
     *
     * @memberof NgxSpinnerComponent
     */
    name: string;
    /**
     * z-index value
     *
     * @memberof NgxSpinnerComponent
     */
    zIndex: number;
    /**
     * Custom template for spinner/loader
     *
     * @memberof NgxSpinnerComponent
     */
    template: string;
    /**
     * Show/Hide the spinner
     *
     * @type {boolean}
     * @memberof NgxSpinnerComponent
     */
    showSpinner: boolean;
    /**
     * To enable/disable animation
     *
     * @type {boolean}
     * @memberof NgxSpinnerComponent
     */
    disableAnimation: boolean;
    /**
     * Spinner Object
     *
     * @memberof NgxSpinnerComponent
     */
    spinner: NgxSpinner;
    /**
     * Array for spinner's div
     *
     * @memberof NgxSpinnerComponent
     */
    divArray: Array<number>;
    /**
     * Counter for div
     *
     * @memberof NgxSpinnerComponent
     *
     */
    divCount: number;
    /**
     * Show spinner
     *
     * @memberof NgxSpinnerComponent
     **/
    show: boolean;
    /**
     * Unsubscribe from spinner's observable
     *
     * @memberof NgxSpinnerComponent
     **/
    ngUnsubscribe: Subject<void>;
    /**
     * Element Reference
     *
     * @memberof NgxSpinnerComponent
     */
    spinnerDOM: {
        nativeElement: any;
    };
    /**
     * Creates an instance of NgxSpinnerComponent.
     *
     * @memberof NgxSpinnerComponent
     */
    constructor(spinnerService: NgxSpinnerService, changeDetector: ChangeDetectorRef, elementRef: ElementRef, globalConfig: NgxSpinnerConfig);
    initObservable(): void;
    /**
     * Initialization method
     *
     * @memberof NgxSpinnerComponent
     */
    ngOnInit(): void;
    /**
     * To check event triggers inside the Spinner Zone
     *
     * @param {*} element
     * @returns {boolean}
     * @memberof NgxSpinnerComponent
     */
    isSpinnerZone(element: any): boolean;
    /**
     * To set default ngx-spinner options
     *
     * @memberof NgxSpinnerComponent
     */
    setDefaultOptions: () => void;
    /**
     * On changes event for input variables
     *
     * @memberof NgxSpinnerComponent
     */
    ngOnChanges(changes: {
        [propKey: string]: SimpleChange;
    }): void;
    /**
     * To get class for spinner
     *
     * @memberof NgxSpinnerComponent
     */
    getClass(type: string, size: Size): string;
    /**
     * Check if input variables have changed
     *
     * @memberof NgxSpinnerComponent
     */
    onInputChange(): void;
    /**
     * Component destroy event
     *
     * @memberof NgxSpinnerComponent
     */
    ngOnDestroy(): void;
    static …µfac: i0.…µ…µFactoryDeclaration<NgxSpinnerComponent, [null, null, null, { optional: true; }]>;
    static …µcmp: i0.…µ…µComponentDeclaration<NgxSpinnerComponent, "ngx-spinner", never, { "bdColor": { "alias": "bdColor"; "required": false; }; "size": { "alias": "size"; "required": false; }; "color": { "alias": "color"; "required": false; }; "type": { "alias": "type"; "required": false; }; "fullScreen": { "alias": "fullScreen"; "required": false; }; "name": { "alias": "name"; "required": false; }; "zIndex": { "alias": "zIndex"; "required": false; }; "template": { "alias": "template"; "required": false; }; "showSpinner": { "alias": "showSpinner"; "required": false; }; "disableAnimation": { "alias": "disableAnimation"; "required": false; }; }, {}, never, ["*"], true, never>;
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               import { MonoTypeOperatorFunction, ObservableInput } from '../types';
/**
 * An object interface used by {@link throttle} or {@link throttleTime} that ensure
 * configuration options of these operators.
 *
 * @see {@link throttle}
 * @see {@link throttleTime}
 */
export interface ThrottleConfig {
    /**
     * If `true`, the resulting Observable will emit the first value from the source
     * Observable at the **start** of the "throttling" process (when starting an
     * internal timer that prevents other emissions from the source to pass through).
     * If `false`, it will not emit the first value from the source Observable at the
     * start of the "throttling" process.
     *
     * If not provided, defaults to: `true`.
     */
    leading?: boolean;
    /**
     * If `true`, the resulting Observable will emit the last value from the source
     * Observable at the **end** of the "throttling" process (when ending an internal
     * timer that prevents other emissions from the source to pass through).
     * If `false`, it will not emit the last value from the source Observable at the
     * end of the "throttling" process.
     *
     * If not provided, defaults to: `false`.
     */
    trailing?: boolean;
}
/**
 * Emits a value from the source Observable, then ignores subsequent source
 * values for a duration determined by another Observable, then repeats this
 * process.
 *
 * <span class="informal">It's like {@link throttleTime}, but the silencing
 * duration is determined by a second Observable.</span>
 *
 * ![](throttle.svg)
 *
 * `throttle` emits the source Observable values on the output Observable
 * when its internal timer is disabled, and ignores source values when the timer
 * is enabled. Initially, the timer is disabled. As soon as the first source
 * value arrives, it is forwarded to the output Observable, and then the timer
 * is enabled by calling the `durationSelector` function with the source value,
 * which returns the "duration" Observable. When the duration Observable emits a
 * value, the timer is disabled, and this process repeats for the
 * next source value.
 *
 * ## Example
 *
 * Emit clicks at a rate of at most one click per second
 *
 * ```ts
 * import { fromEvent, throttle, interval } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(throttle(() => interval(1000)));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link debounce}
 * @see {@link delayWhen}
 * @see {@link sample}
 * @see {@link throttleTime}
 *
 * @param durationSelector A function that receives a value from the source
 * Observable, for computing the silencing duration for each source value,
 * returned as an `ObservableInput`.
 * @param config A configuration object to define `leading` and `trailing`
 * behavior. Defaults to `{ leading: true, trailing: false }`.
 * @return A function that returns an Observable that performs the throttle
 * operation to limit the rate of emissions from the source.
 */
export declare function throttle<T>(durationSelector: (value: T) => ObservableInput<any>, config?: ThrottleConfig): MonoTypeOperatorFunction<T>;
//# sourceMappingURL=throttle.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           import { Subject, AnonymousSubject } from '../../Subject';
import { Subscriber } from '../../Subscriber';
import { Observable } from '../../Observable';
import { Subscription } from '../../Subscription';
import { Operator } from '../../Operator';
import { ReplaySubject } from '../../ReplaySubject';
import { Observer, NextObserver } from '../../types';

/**
 * WebSocketSubjectConfig is a plain Object that allows us to make our
 * webSocket configurable.
 *
 * <span class="informal">Provides flexibility to {@link webSocket}</span>
 *
 * It defines a set of properties to provide custom behavior in specific
 * moments of the socket's lifecycle. When the connection opens we can
 * use `openObserver`, when the connection is closed `closeObserver`, if we
 * are interested in listening for data coming from server: `deserializer`,
 * which allows us to customize the deserialization strategy of data before passing it
 * to the socket client. By default, `deserializer` is going to apply `JSON.parse` to each message coming
 * from the Server.
 *
 * ## Examples
 *
 * **deserializer**, the default for this property is `JSON.parse` but since there are just two options
 * for incoming data, either be text or binary data. We can apply a custom deserialization strategy
 * or just simply skip the default behaviour.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   //Apply any transformation of your choice.
 *   deserializer: ({ data }) => data
 * });
 *
 * wsSubject.subscribe(console.log);
 *
 * // Let's suppose we have this on the Server: ws.send('This is a msg from the server')
 * //output
 * //
 * // This is a msg from the server
 * ```
 *
 * **serializer** allows us to apply custom serialization strategy but for the outgoing messages.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   // Apply any transformation of your choice.
 *   serializer: msg => JSON.stringify({ channel: 'webDevelopment', msg: msg })
 * });
 *
 * wsSubject.subscribe(() => subject.next('msg to the server'));
 *
 * // Let's suppose we have this on the Server:
 * //   ws.on('message', msg => console.log);
 * //   ws.send('This is a msg from the server');
 * // output at server side:
 * //
 * // {"channel":"webDevelopment","msg":"msg to the server"}
 * ```
 *
 * **closeObserver** allows us to set a custom error when an error raises up.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   closeObserver: {
 *     next() {
 *       const customError = { code: 6666, reason: 'Custom evil reason' }
 *       console.log(`code: ${ customError.code }, reason: ${ customError.reason }`);
 *     }
 *   }
 * });
 *
 * // output
 * // code: 6666, reason: Custom evil reason
 * ```
 *
 * **openObserver**, Let's say we need to make some kind of init task before sending/receiving msgs to the
 * webSocket or sending notification that the connection was successful, this is when
 * openObserver is useful for.
 *
 * ```ts
 * import { webSocket } from 'rxjs/webSocket';
 *
 * const wsSubject = webSocket({
 *   url: 'ws://localhost:8081',
 *   openObserver: {
 *     next: () => {
 *       console.log('Connection ok');
 *     }
 *   }
 * });
 *
 * // output
 * // Connection ok
 * ```
 */
export interface WebSocketSubjectConfig<T> {
  /** The url of the socket server to connect to */
  url: string;
  /** The protocol to use to connect */
  protocol?: string | Array<string>;
  /** @deprecated Will be removed in v8. Use {@link deserializer} instead. */
  resultSelector?: (e: MessageEvent) => T;
  /**
   * A serializer used to create messages from passed values before the
   * messages are sent to the server. Defaults to JSON.stringify.
   */
  serializer?: (value: T) => WebSocketMessage;
  /**
   * A deserializer used for messages arriving on the socket from the
   * server. Defaults to JSON.parse.
   */
  deserializer?: (e: MessageEvent) => T;
  /**
   * An Observer that watches when open events occur on the underlying web socket.
   */
  openObserver?: NextObserver<Event>;
  /**
   * An Observer that watches when close events occur on the underlying web socket
   */
  closeObserver?: NextObserver<CloseEvent>;
  /**
   * An Observer that watches when a close is about to occur due to
   * unsubscription.
   */
  closingObserver?: NextObserver<void>;
  /**
   * A WebSocket constructor to use. This is useful for situations like using a
   * WebSocket impl in Node (WebSocket is a DOM API), or for mocking a WebSocket
   * for testing purposes
   */
  WebSocketCtor?: { new (url: string, protocols?: string | string[]): WebSocket };
  /** Sets the `binaryType` property of the underlying WebSocket. */
  binaryType?: 'blob' | 'arraybuffer';
}

const DEFAULT_WEBSOCKET_CONFIG: WebSocketSubjectConfig<any> = {
  url: '',
  deserializer: (e: MessageEvent) => JSON.parse(e.data),
  serializer: (value: any) => JSON.stringify(value),
};

const WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT =
  'WebSocketSubject.error must be called with an object with an error code, and an optional reason: { code: number, reason: string }';

export type WebSocketMessage = string | ArrayBuffer | Blob | ArrayBufferView;

export class WebSocketSubject<T> extends AnonymousSubject<T> {
  // @ts-ignore: Property has no initializer and is not definitely assigned
  private _config: WebSocketSubjectConfig<T>;

  /** @internal */
  // @ts-ignore: Property has no initializer and is not definitely assigned
  _output: Subject<T>;

  private _socket: WebSocket | null = null;

  constructor(urlConfigOrSource: string | WebSocketSubjectConfig<T> | Observable<T>, destination?: Observer<T>) {
    super();
    if (urlConfigOrSource instanceof Observable) {
      this.destination = destination;
      this.source = urlConfigOrSource as Observable<T>;
    } else {
      const config = (this._config = { ...DEFAULT_WEBSOCKET_CONFIG });
      this._output = new Subject<T>();
      if (typeof urlConfigOrSource === 'string') {
        config.url = urlConfigOrSource;
      } else {
        for (const key in urlConfigOrSource) {
          if (urlConfigOrSource.hasOwnProperty(key)) {
            (config as any)[key] = (urlConfigOrSource as any)[key];
          }
        }
      }

      if (!config.WebSocketCtor && WebSocket) {
        config.WebSocketCtor = WebSocket;
      } else if (!config.WebSocketCtor) {
        throw new Error('no WebSocket constructor can be found');
      }
      this.destination = new ReplaySubject();
    }
  }

  /** @deprecated Internal implementation detail, do not use directly. Will be made internal in v8. */
  lift<R>(operator: Operator<T, R>): WebSocketSubject<R> {
    const sock = new WebSocketSubject<R>(this._config as WebSocketSubjectConfig<any>, this.destination as any);
    sock.operator = operator;
    sock.source = this;
    return sock;
  }

  private _resetState() {
    this._socket = null;
    if (!this.source) {
      this.destination = new ReplaySubject();
    }
    this._output = new Subject<T>();
  }

  /**
   * Creates an {@link Observable}, that when subscribed to, sends a message,
   * defined by the `subMsg` function, to the server over the socket to begin a
   * subscription to data over that socket. Once data arrives, the
   * `messageFilter` argument will be used to select the appropriate data for
   * the resulting Observable. When finalization occurs, either due to
   * unsubscription, completion, or error, a message defined by the `unsubMsg`
   * argument will be sent to the server over the WebSocketSubject.
   *
   * @param subMsg A function to generate the subscription message to be sent to
   * the server. This will still be processed by the serializer in the
   * WebSocketSubject's config. (Which defaults to JSON serialization)
   * @param unsubMsg A function to generate the unsubscription message to be
   * sent to the server at finalization. This will still be processed by the
   * serializer in the WebSocketSubject's config.
   * @param messageFilter A predicate for selecting the appropriate messages
   * from the server for the output stream.
   */
  multiplex(subMsg: () => any, unsubMsg: () => any, messageFilter: (value: T) => boolean) {
    const self = this;
    return new Observable((observer: Observer<T>) => {
      try {
        self.next(subMsg());
      } catch (err) {
        observer.error(err);
      }

      const subscription = self.subscribe({
        next: (x) => {
          try {
            if (messageFilter(x)) {
              observer.next(x);
            }
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });

      return () => {
        try {
          self.next(unsubMsg());
        } catch (err) {
          observer.error(err);
        }
        subscription.unsubscribe();
      };
    });
  }

  private _connectSocket() {
    const { WebSocketCtor, protocol, url, binaryType } = this._config;
    const observer = this._output;

    let socket: WebSocket | null = null;
    try {
      socket = protocol ? new WebSocketCtor!(url, protocol) : new WebSocketCtor!(url);
      this._socket = socket;
      if (binaryType) {
        this._socket.binaryType = binaryType;
      }
    } catch (e) {
      observer.error(e);
      return;
    }

    const subscription = new Subscription(() => {
      this._socket = null;
      if (socket && socket.readyState === 1) {
        socket.close();
      }
    });

    socket.onopen = (evt: Event) => {
      const { _socket } = this;
      if (!_socket) {
        socket!.close();
        this._resetState();
        return;
      }
      const { openObserver } = this._config;
      if (openObserver) {
        openObserver.next(evt);
      }

      const queue = this.destination;

      this.destination = Subscriber.create<T>(
        (x) => {
          if (socket!.readyState === 1) {
            try {
              const { serializer } = this._config;
              socket!.send(serializer!(x!));
            } catch (e) {
              this.destination!.error(e);
            }
          }
        },
        (err) => {
          const { closingObserver } = this._config;
          if (closingObserver) {
            closingObserver.next(undefined);
          }
          if (err && err.code) {
            socket!.close(err.code, err.reason);
          } else {
            observer.error(new TypeError(WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT));
          }
          this._resetState();
        },
        () => {
          const { closingObserver } = this._config;
          if (closingObserver) {
            closingObserver.next(undefined);
          }
          socket!.close();
          this._resetState();
        }
      ) as Subscriber<any>;

      if (queue && queue instanceof ReplaySubject) {
        subscription.add((queue as ReplaySubject<T>).subscribe(this.destination));
      }
    };

    socket.onerror = (e: Event) => {
      this._resetState();
      observer.error(e);
    };

    socket.onclose = (e: CloseEvent) => {
      if (socket === this._socket) {
        this._resetState();
      }
      const { closeObserver } = this._config;
      if (closeObserver) {
        closeObserver.next(e);
      }
      if (e.wasClean) {
        observer.complete();
      } else {
        observer.error(e);
      }
    };

    socket.onmessage = (e: MessageEvent) => {
      try {
        const { deserializer } = this._config;
        observer.next(deserializer!(e));
      } catch (err) {
        observer.error(err);
      }
    };
  }

  /** @internal */
  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    const { source } = this;
    if (source) {
      return source.subscribe(subscriber);
    }
    if (!this._socket) {
      this._connectSocket();
    }
    this._output.subscribe(subscriber);
    subscriber.add(() => {
      const { _socket } = this;
      if (this._output.observers.length === 0) {
        if (_socket && (_socket.readyState === 1 || _socket.readyState === 0)) {
          _socket.close();
        }
        this._resetState();
      }
    });
    return subscriber;
  }

  unsubscribe() {
    const { _socket } = this;
    if (_socket && (_socket.readyState === 1 || _socket.readyState === 0)) {
      _socket.close();
    }
    this._resetState();
    super.unsubscribe();
  }
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       import { asyncScheduler } from '../scheduler/async';
import { throttle, ThrottleConfig } from './throttle';
import { MonoTypeOperatorFunction, SchedulerLike } from '../types';
import { timer } from '../observable/timer';

/**
 * Emits a value from the source Observable, then ignores subsequent source
 * values for `duration` milliseconds, then repeats this process.
 *
 * <span class="informal">Lets a value pass, then ignores source values for the
 * next `duration` milliseconds.</span>
 *
 * ![](throttleTime.png)
 *
 * `throttleTime` emits the source Observable values on the output Observable
 * when its internal timer is disabled, and ignores source values when the timer
 * is enabled. Initially, the timer is disabled. As soon as the first source
 * value arrives, it is forwarded to the output Observable, and then the timer
 * is enabled. After `duration` milliseconds (or the time unit determined
 * internally by the optional `scheduler`) has passed, the timer is disabled,
 * and this process repeats for the next source value. Optionally takes a
 * {@link SchedulerLike} for managing timers.
 *
 * ## Examples
 *
 * ### Limit click rate
 *
 * Emit clicks at a rate of at most one click per second
 *
 * ```ts
 * import { fromEvent, throttleTime } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(throttleTime(1000));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link auditTime}
 * @see {@link debounceTime}
 * @see {@link delay}
 * @see {@link sampleTime}
 * @see {@link throttle}
 *
 * @param duration Time to wait before emitting another value after
 * emitting the last value, measured in milliseconds or the time unit determined
 * internally by the optional `scheduler`.
 * @param scheduler The {@link SchedulerLike} to use for
 * managing the timers that handle the throttling. Defaults to {@link asyncScheduler}.
 * @param config A configuration object to define `leading` and
 * `trailing` behavior. Defaults to `{ leading: true, trailing: false }`.
 * @return A function that returns an Observable that performs the throttle
 * operation to limit the rate of emissions from the source.
 */
export function throttleTime<T>(
  duration: number,
  scheduler: SchedulerLike = asyncScheduler,
  config?: ThrottleConfig
): MonoTypeOperatorFunction<T> {
  const duration$ = timer(duration, scheduler);
  return throttle(() => duration$, config);
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                import { ThrottleConfig } from './throttle';
import { MonoTypeOperatorFunction, SchedulerLike } from '../types';
/**
 * Emits a value from the source Observable, then ignores subsequent source
 * values for `duration` milliseconds, then repeats this process.
 *
 * <span class="informal">Lets a value pass, then ignores source values for the
 * next `duration` milliseconds.</span>
 *
 * ![](throttleTime.png)
 *
 * `throttleTime` emits the source Observable values on the output Observable
 * when its internal timer is disabled, and ignores source values when the timer
 * is enabled. Initially, the timer is disabled. As soon as the first source
 * value arrives, it is forwarded to the output Observable, and then the timer
 * is enabled. After `duration` milliseconds (or the time unit determined
 * internally by the optional `scheduler`) has passed, the timer is disabled,
 * and this process repeats for the next source value. Optionally takes a
 * {@link SchedulerLike} for managing timers.
 *
 * ## Examples
 *
 * ### Limit click rate
 *
 * Emit clicks at a rate of at most one click per second
 *
 * ```ts
 * import { fromEvent, throttleTime } from 'rxjs';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(throttleTime(1000));
 *
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link auditTime}
 * @see {@link debounceTime}
 * @see {@link delay}
 * @see {@link sampleTime}
 * @see {@link throttle}
 *
 * @param duration Time to wait before emitting another value after
 * emitting the last value, measured in milliseconds or the time unit determined
 * internally by the optional `scheduler`.
 * @param scheduler The {@link SchedulerLike} to use for
 * managing the timers that handle the throttling. Defaults to {@link asyncScheduler}.
 * @param config A configuration object to define `leading` and
 * `trailing` behavior. Defaults to `{ leading: true, trailing: false }`.
 * @return A function that returns an Observable that performs the throttle
 * operation to limit the rate of emissions from the source.
 */
export declare function throttleTime<T>(duration: number, scheduler?: SchedulerLike, config?: ThrottleConfig): MonoTypeOperatorFunction<T>;
//# sourceMappingURL=throttleTime.d.ts.map                                                                                                                                                                                                                                                                                                                                                            