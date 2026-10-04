/* Minimal stand-ins for the NSS/NSPR symbols the bundled headless Chromium links
   against; the sandbox image has no system NSS. tools/devkit/setup.sh extends this
   file automatically until Chromium starts. */
#define S(x) void *x(void) __asm__(#x); void *x(void){return 0;}
S(PR_GetError) S(PR_GetErrorText) S(PR_GetErrorTextLength) S(PR_SetError) S(PR_Init) S(PR_Cleanup)
S(PR_GetEnv) S(PR_SetEnv) S(PR_Now) S(PR_IntervalNow) S(PR_IntervalToMilliseconds) S(PR_MillisecondsToInterval)
S(PR_NewLock) S(PR_DestroyLock) S(PR_Lock) S(PR_Unlock) S(PR_NewCondVar) S(PR_DestroyCondVar)
S(PR_WaitCondVar) S(PR_NotifyCondVar) S(PR_NotifyAllCondVar) S(PR_CreateThread) S(PR_JoinThread)
S(PR_GetCurrentThread) S(PR_Sleep) S(PR_Open) S(PR_Close) S(PR_Read) S(PR_Write) S(PR_Seek)
S(PR_GetFileInfo) S(PR_Malloc) S(PR_Calloc) S(PR_Realloc) S(PR_Free) S(PR_NewTCPSocket)
S(PR_CloseSocket) S(PR_Connect) S(PR_Bind) S(PR_Listen) S(PR_Accept) S(PR_GetHostByName)
S(PR_GetOSError) S(PR_SetErrorText) S(PR_AtomicIncrement) S(PR_AtomicDecrement) S(PR_GetLibraryName)
S(NSS_Init) S(NSS_NoDB_Init) S(NSS_Shutdown) S(PK11_GetInternalKeySlot) S(NSS_SetDomesticPolicy)
S(SSL_OptionSetDefault) S(SSL_GetImplementedCiphers) S(SSL_GetNumImplementedCiphers) S(CERT_GetDefaultCertDB)
