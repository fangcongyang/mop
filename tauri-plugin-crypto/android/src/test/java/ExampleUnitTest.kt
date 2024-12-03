package com.plugin.crypto

import org.junit.Test

import org.junit.Assert.*

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * See [testing documentation](http://d.android.com/tools/testing).
 */
class ExampleUnitTest {
    @Test
    fun rsa_encrypt() {
        var crypto = Crypto()
        var rsaCryptoRequest = RsaCryptoRequest()
        rsaCryptoRequest.data = "123"
        rsaCryptoRequest.key =
            "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB\n-----END PUBLIC KEY-----"
        System.out.println(crypto.rsaEncrypt(rsaCryptoRequest))
    }


    @Test
    fun aes_encrypt() {
        var crypto = Crypto()
        var aesCryptoArgs = AesCryptoArgs()
        aesCryptoArgs.text = "{\"limit\":10,\"offset\":0,\"total\":true,\"area\":\"all\",\"csrf_token\":\"f8ddbe811c8055d9fecd2f3a1beffd15\"}"
        aesCryptoArgs.mode = "cbc"
        aesCryptoArgs.key = "0CoJUm6Qyw8W8jud"
        aesCryptoArgs.iv = "0102030405060708"
        aesCryptoArgs.encode = "base64"
        var param1 = crypto.aesEncrypt(aesCryptoArgs);
        System.out.println(param1)
        aesCryptoArgs.text = "{\"uid\":427816037,\"csrf_token\":\"f8ddbe811c8055d9fecd2f3a1beffd15\"}"
        aesCryptoArgs.mode = "cbc"
        aesCryptoArgs.key = "0CoJUm6Qyw8W8jud"
        aesCryptoArgs.iv = "0102030405060708"
        aesCryptoArgs.encode = "base64"
    }
}
