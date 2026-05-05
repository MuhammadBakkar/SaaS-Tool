windUnitOfWork(
        completedWork,
        workInProgressRootDidSkipSuspendedSiblings
      );
      return;
    }
    var current = completedWork.alternate;
    unitOfWork = completedWork.return;
    startProfilerTimer(completedWork);
    current = completeWork(current, completedWork, entangledRenderLanes);
    0 !== (completedWork.mode & 2) &&
      stopProfilerTimerIfRunningAndRecordIncompleteDuration(completedWork);
    if (null !== current) {
      workInProgress = current;
      return;
    }
    completedWork = completedWork.sibling;
    if (null !== completedWork) {
      workInProgress = completedWork;
      return;
    }
    workInProgress = completedWork = unitOfWork;
  } while (null !== completedWork);
  0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 5);
}
function unwindUnitOfWork(unitOfWork, skipSiblings) {
  do {
    var next = unwindWork(unitOfWork.alternate, unitOfWork);
    if (null !== next) {
      next.flags &= 32767;
      workInProgress = next;
      return;
    }
    if (0 !== (unitOfWork.mode & 2)) {
      stopProfilerTimerIfRunningAndRecordIncompleteDuration(unitOfWork);
      next = unitOfWork.actualDuration;
      for (var child = unitOfWork.child; null !== child; )
        (next += child.actualDuration), (child = child.sibling);
      unitOfWork.actualDuration = next;
    }
    next = unitOfWork.return;
    null !== next &&
      ((next.flags |= 32768), (next.subtreeFlags = 0), (next.deletions = null));
    if (
      !skipSiblings &&
      ((unitOfWork = unitOfWork.sibling), null !== unitOfWork)
    ) {
      workInProgress = unitOfWork;
      return;
    }
    workInProgress = unitOfWork = next;
  } while (null !== unitOfWork);
  workInProgressRootExitStatus = 6;
  workInProgress = null;
}
function commitRoot(
  root,
  finishedWork,
  lanes,
  recoverableErrors,
  transitions,
  didIncludeRenderPhaseUpdate,
  spawnedLane,
  updatedLanes,
  suspendedRetryLanes,
  exitStatus,
  suspendedState,
  suspendedCommitReason,
  completedRenderStartTime,
  completedRenderEndTime
) {
  root.cancelPendingCommit = null;
  do flushPendingEffects();
  while (0 !== pendingEffectsStatus);
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
  setCurrentTrackFromLanes(lanes);
  2 === exitStatus
    ? logErroredRenderPhase(completedRenderStartTime, completedRenderEndTime)
    : null !== recoverableErrors
      ? !supportsUserTiming ||
        completedRenderEndTime <= completedRenderStartTime ||
        console.timeStamp(
          "Recovered",
          completedRenderStartTime,
          completedRenderEndTime,
          currentTrack,
          "Scheduler \u269b",
          "error"
        )
      : !supportsUserTiming ||
        completedRenderEndTime <= completedRenderStartTime ||
        console.timeStamp(
          (lanes & 536870912) === lanes
            ? "Prepared"
            : (lanes & 201326741) === lanes
              ? "Hydrated"
              : "Render",
          completedRenderStartTime,
          completedRenderEndTime,
          currentTrack,
          "Scheduler \u269b",
          (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark"
        );
  if (null !== finishedWork) {
    if (finishedWork === root.current) throw Error(formatProdErrorMessage(177));
    didIncludeRenderPhaseUpdate = finishedWork.lanes | finishedWork.childLanes;
    didIncludeRenderPhaseUpdate |= concurrentlyUpdatedLanes;
    markRootFinished(
      root,
      lanes,
      didIncludeRenderPhaseUpdate,
      spawnedLane,
      updatedLanes,
      suspendedRetryLanes
    );
    root === workInProgressRoot &&
      ((workInProgress = workInProgressRoot = null),
      (workInProgressRootRenderLanes = 0));
    pendingFinishedWork = finishedWork;
    pendingEffectsRoot = root;
    pendingEffectsLanes = lanes;
    pendingEffectsRemainingLanes = didIncludeRenderPhaseUpdate;
    pendingPassiveTransitions = transitions;
    pendingRecoverableErrors = recoverableErrors;
    pendingEffectsRenderEndTime = completedRenderEndTime;
    pendingSuspendedCommitReason = suspendedCommitReason;
    pendingDelayedCommitReason = 0;
    pendingSuspendedViewTransitionReason = null;
    0 !== finishedWork.actualDuration ||
    0 !== (finishedWork.subtreeFlags & 10256) ||
    0 !== (finishedWork.flags & 10256)
      ? ((root.callbackNode = null),
        (root.callbackPriority = 0),
        scheduleCallback$1(NormalPriority$1, function () {
          schedulerEvent = window.event;
          0 === pendingDelayedCommitReason && (pendingDelayedCommitReason = 2);
          flushPassiveEffects();
          return null;
        }))
      : ((root.callbackNode = null), (root.callbackPriority = 0));
    commitErrors = null;
    commitStartTime = now();
    null !== suspendedCommitReason &&
      (!supportsUserTiming ||
        commitStartTime <= completedRenderEndTime ||
        console.timeStamp(
          suspendedCommitReason,
          completedRenderEndTime,
          commitStartTime,
          currentTrack,
          "Scheduler \u269b",
          "secondary-light"
        ));
    recoverableErrors = 0 !== (finishedWork.flags & 13878);
    if (0 !== (finishedWork.subtreeFlags & 13878) || recoverableErrors) {
      recoverableErrors = ReactSharedInternals.T;
      ReactSharedInternals.T = null;
      transitions = ReactDOMSharedInternals.p;
      ReactDOMSharedInternals.p = 2;
      spawnedLane = executionContext;
      executionContext |= 4;
      try {
        commitBeforeMutationEffects(root, finishedWork, lanes);
      } finally {
        (executionContext = spawnedLane),
          (ReactDOMSharedInternals.p = transitions),
          (ReactSharedInternals.T = recoverableErrors);
      }
    }
    pendingEffectsStatus = 1;
    flushMutationEffects();
    flushLayoutEffects();
    flushSpawnedWork();
  }
}
function flushMutationEffects() {
  if (1 === pendingEffectsStatus) {
    pendingEffectsStatus = 0;
    var root = pendingEffectsRoot,
      finishedWork = pendingFinishedWork,
      lanes = pendingEffectsLanes,
      rootMutationHasEffect = 0 !== (finishedWork.flags & 13878);
    if (0 !== (finishedWork.subtreeFlags & 13878) || rootMutationHasEffect) {
      rootMutationHasEffect = ReactSharedInternals.T;
      ReactSharedInternals.T = null;
      var previousPriority = ReactDOMSharedInternals.p;
      ReactDOMSharedInternals.p = 2;
      var prevExecutionContext = executionContext;
      executionContext |= 4;
      try {
        inProgressLanes = lanes;
        inProgressRoot = root;
        resetComponentEffectTimers();
        commitMutationEffectsOnFiber(finishedWork, root);
        inProgressRoot = inProgressLanes = null;
        lanes = selectionInformation;
        var curFocusedElem = getActiveElementDeep(root.containerInfo),
          priorFocusedElem = lanes.focusedElem,
          priorSelectionRange = lanes.selectionRange;
        if (
          curFocusedElem !== priorFocusedElem &&
          priorFocusedElem &&
          priorFocusedElem.ownerDocument &&
          containsNode(
            priorFocusedElem.ownerDocument.documentElement,
            priorFocusedElem
          )
        ) {
          if (
            null !== priorSelectionRange &&
            hasSelectionCapabilities(priorFocusedElem)
          ) {
            var start = priorSelectionRange.start,
              end = priorSelectionRange.end;
            void 0 === end && (end = start);
            if ("selectionStart" in priorFocusedElem)
              (priorFocusedElem.selectionStart = start),
                (priorFocusedElem.selectionEnd = Math.min(
                  end,
                  priorFocusedElem.value.length
                ));
            else {
              var doc = priorFocusedElem.ownerDocument || document,
                win = (doc && doc.defaultView) || window;
              if (win.getSelection) {
                var selection = win.getSelection(),
                  length = priorFocusedElem.textContent.length,
                  start$jscomp$0 = Math.min(priorSelectionRange.start, length),
                  end$jscomp$0 =
                    void 0 === priorSelectionRange.end
                      ? start$jscomp$0
                      : Math.min(priorSelectionRange.end, length);
                !selection.extend &&
                  start$jscomp$0 > end$jscomp$0 &&
                  ((curFocusedElem = end$jscomp$0),
                  (end$jscomp$0 = start$jscomp$0),
                  (start$jscomp$0 = curFocusedElem));
                var startMarker = getNodeForCharacterOffset(
                    priorFocusedElem,
                    start$jscomp$0
                  ),
                  endMarker = getNodeForCharacterOffset(
                    priorFocusedElem,
                    end$jscomp$0
                  );
                if (
                  startMarker &&
                  endMarker &&
                  (1 !== selection.rangeCount ||
                    selection.anchorNode !== startMarker.node ||
                    selection.anchorOffset !== startMarker.offset ||
                    selection.focusNode !== endMarker.node ||
                    selection.focusOffset !== endMarker.offset)
                ) {
                  var range = doc.createRange();
                  range.setStart(startMarker.node, startMarker.offset);
                  selection.removeAllRanges();
                  start$jscomp$0 > end$jscomp$0
                    ? (selection.addRange(range),
                      selection.extend(endMarker.node, endMarker.offset))
                    : (range.setEnd(endMarker.node, endMarker.offset),
                      selection.addRange(range));
                }
              }
            }
          }
          doc = [];
          for (
            selection = priorFocusedElem;
            (selection = selection.parentNode);

          )
            1 === selection.nodeType &&
              doc.push({
                element: selection,
                left: selection.scrollLeft,
                top: selection.scrollTop
              });
          "function" === typeof priorFocusedElem.focus &&
            priorFocusedElem.focus();
          for (
            priorFocusedElem = 0;
            priorFocusedElem < doc.length;
            priorFocusedElem++
          ) {
            var info = doc[priorFocusedElem];
            info.element.scrollLeft = info.left;
            info.element.scrollTop = info.top;
          }
        }
        _enabled = !!eventsEnabled;
        selectionInformation = eventsEnabled = null;
      } finally {
        (executionContext = prevExecutionContext),
          (ReactDOMSharedInternals.p = previousPriority),
          (ReactSharedInternals.T = rootMutationHasEffect);
      }
    }
    root.current = finishedWork;
    pendingEffectsStatus = 2;
  }
}
function flushLayoutEffects() {
  if (2 === pendingEffectsStatus) {
    pendingEffectsStatus = 0;
    var suspendedViewTransitionReason = pendingSuspendedViewTransitionReason;
    null !== suspendedViewTransitionReason &&
      ((commitStartTime = now()),
      !supportsUserTiming ||
        commitStartTime <= commitEndTime ||
        console.timeStamp(
          suspendedViewTransitionReason,
          commitEndTime,
          commitStartTime,
          currentTrack,
          "Scheduler \u269b",
          "secondary-light"
        ));
    suspendedViewTransitionReason = pendingEffectsRoot;
    var finishedWork = pendingFinishedWork,
      lanes = pendingEffectsLanes,
      rootHasLayoutEffect = 0 !== (finishedWork.flags & 8772);
    if (0 !== (finishedWork.subtreeFlags & 8772) || rootHasLayoutEffect) {
      rootHasLayoutEffect = ReactSharedInternals.T;
      ReactSharedInternals.T = null;
      var previousPriority = ReactDOMSharedInternals.p;
      ReactDOMSharedInternals.p = 2;
      var prevExecutionContext = executionContext;
      executionContext |= 4;
      try {
        (inProgressLanes = lanes),
          (inProgressRoot = suspendedViewTransitionReason),
          resetComponentEffectTimers(),
          commitLayoutEffectOnFiber(
            suspendedViewTransitionReason,
            finishedWork.alternate,
            finishedWork
          ),
          (inProgressRoot = inProgressLanes = null);
      } finally {
        (executionContext = prevExecutionContext),
          (ReactDOMSharedInternals.p = previousPriority),
          (ReactSharedInternals.T = rootHasLayoutEffect);
      }
    }
    suspendedViewTransitionReason = pendingEffectsRenderEndTime;
    finishedWork = pendingSuspendedCommitReason;
    commitEndTime = now();
    suspendedViewTransitionReason =
      null === finishedWork ? suspendedViewTransitionReason : commitStartTime;
    finishedWork = commitEndTime;
    lanes = 1 === pendingDelayedCommitReason;
    null !== commitErrors
      ? logCommitErrored(suspendedViewTransitionReason, finishedWork)
      : !supportsUserTiming ||
        finishedWork <= suspendedViewTransitionReason ||
        console.timeStamp(
          lanes ? "Commit Interrupted View Transition" : "Commit",
          suspendedViewTransitionReason,
          finishedWork,
          currentTrack,
          "Scheduler \u269b",
          lanes ? "error" : "secondary-dark"
        );
    pendingEffectsStatus = 3;
  }
}
function flushSpawnedWork() {
  if (4 === pendingEffectsStatus || 3 === pendingEffectsStatus) {
    if (4 === pendingEffectsStatus) {
      var startViewTransitionStartTime = commitEndTime;
      commitEndTime = now();
      var abortedViewTransition = 1 === pendingDelayedCommitReason;
      !supportsUserTiming ||
        commitEndTime <= startViewTransitionStartTime ||
        console.timeStamp(
          abortedViewTransition
            ? "Interrupted View Transition"
            : "Starting Animation",
          startViewTransitionStartTime,
          commitEndTime,
          currentTrack,
          "Scheduler \u269b",
          abortedViewTransition ? " error" : "secondary-light"
        );
      1 !== pendingDelayedCommitReason && (pendingDelayedCommitReason = 3);
    }
    pendingEffectsStatus = 0;
    requestPaint();
    startViewTransitionStartTime = pendingEffectsRoot;
    var finishedWork = pendingFinishedWork;
    abortedViewTransition = pendingEffectsLanes;
    var recoverableErrors = pendingRecoverableErrors,
      rootDidHavePassiveEffects =
        0 !== finishedWork.actualDuration ||
        0 !== (finishedWork.subtreeFlags & 10256) ||
        0 !== (finishedWork.flags & 10256);
    rootDidHavePassiveEffects
      ? (pendingEffectsStatus = 5)
      : ((pendingEffectsStatus = 0),
        (pendingFinishedWork = pendingEffectsRoot = null),
        releaseRootPooledCache(
          startViewTransitionStartTime,
          startViewTransitionStartTime.pendingLanes
        ));
    var remainingLanes = startViewTransitionStartTime.pendingLanes;
    0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
    remainingLanes = lanesToEventPriority(abortedViewTransition);
    finishedWork = finishedWork.stateNode;
    if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
      try {
        var didError = 128 === (finishedWork.current.flags & 128);
        switch (remainingLanes) {
          case 2:
            var schedulerPriority = ImmediatePriority;
            break;
          case 8:
            schedulerPriority = UserBlockingPriority;
            break;
          case 32:
            schedulerPriority = NormalPriority$1;
            break;
          case 268435456:
            schedulerPriority = IdlePriority;
            break;
          default:
            schedulerPriority = NormalPriority$1;
        }
        injectedHook.onCommitFiberRoot(
          rendererID,
          finishedWork,
          schedulerPriority,
          didError
        );
      } catch (err) {}
    isDevToolsPresent && startViewTransitionStartTime.memoizedUpdaters.clear();
    if (null !== recoverableErrors) {
      didError = ReactSharedInternals.T;
      schedulerPriority = ReactDOMSharedInternals.p;
      ReactDOMSharedInternals.p = 2;
      ReactSharedInternals.T = null;
      try {
        var onRecoverableError =
          startViewTransitionStartTime.onRecoverableError;
        for (
          finishedWork = 0;
          finishedWork < recoverableErrors.length;
          finishedWork++
        ) {
          var recoverableError = recoverableErrors[finishedWork];
          onRecoverableError(recoverableError.value, {
            componentStack: recoverableError.stack
          });
        }
      } finally {
        (ReactSharedInternals.T = didError),