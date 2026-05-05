xPtr->lowLimit  = ctxPtr->dictLimit;
    ctxPtr->dictStart  = ctxPtr->prefixStart;
    ctxPtr->dictLimit += (U32)(ctxPtr->end - ctxPtr->prefixStart);
    ctxPtr->prefixStart = newBlock;
    ctxPtr->end  = newBlock;
    ctxPtr->nextToUpdate = ctxPtr->dictLimit;   /* match referencing will resume from there */

    /* cannot reference an extDict and a dictCtx at the same time */
    ctxPtr->dictCtx = NULL;
}

static int
LZ4_compressHC_continue_generic (LZ4_streamHC_t* LZ4_streamHCPtr,
                                 const char* src, char* dst,
                                 int* srcSizePtr, int dstCapacity,
                                 limitedOutput_directive limit)
{
    LZ4HC_CCtx_internal* const ctxPtr = &LZ4_streamHCPtr->internal_donotuse;
    DEBUGLOG(5, "LZ4_compressHC_continue_generic(ctx=%p, src=%p, srcSize=%d, limit=%d)",
          