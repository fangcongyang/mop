package com.plugin.crypto

import org.apache.commons.codec.binary.Base64
import java.nio.charset.StandardCharsets
import java.security.KeyFactory
import java.security.MessageDigest
import java.security.PublicKey
import java.security.spec.X509EncodedKeySpec
import java.util.Arrays
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec


class Crypto {
   fun aesEncrypt(args: AesCryptoArgs): String {
        val mode = args.mode
        val cipher = Cipher.getInstance("AES/$mode/PKCS5Padding")
        val keySpec = SecretKeySpec(args.key?.toByteArray(charset("UTF-8")), "AES")
        if (mode == "cbc") {
            val ivSpec = IvParameterSpec(args.iv?.toByteArray(charset("UTF-8")))
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec)
        } else {
            cipher.init(Cipher.ENCRYPT_MODE, keySpec)
        }
        val encrypted = cipher.doFinal(args.text?.toByteArray(charset("UTF-8")))
        if (args.encode == "base64") {
            return String(Base64.encodeBase64(encrypted))
        }
        return bytesToHex(encrypted)
   }

    fun rsaEncrypt(args: RsaCryptoRequest): String {
        val publicKeyPEM = args.key?.replace("-----BEGIN PUBLIC KEY-----\n", "")
            ?.replace("\n-----END PUBLIC KEY-----", "")
            ?.replace("\\s".toRegex(), "")
        val keySpec = X509EncodedKeySpec(Base64.decodeBase64(publicKeyPEM))
        val keyFactory = KeyFactory.getInstance("RSA")
        val publicKey: PublicKey = keyFactory.generatePublic(keySpec)
        val cipher = Cipher.getInstance("RSA/ECB/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, publicKey)
        val data = args.data?.let { padData(it) }
        val encrypted = cipher.doFinal(data)
        val rsaPublicKeyLength = getRSAPublicKeyLength(publicKey)
        val paddedData = ByteArray(rsaPublicKeyLength)
        System.arraycopy(encrypted, 0, paddedData, rsaPublicKeyLength - encrypted.size, encrypted.size)
        return bytesToHex(paddedData)
    }

    fun hashEncrypt(args: HashEncryptRequest): String {
        if (args.data.isNullOrEmpty()) {
            return ""
        }
        return md5(args.data!!)
    }

    // 获取 RSA 公钥的长度
    private fun getRSAPublicKeyLength(publicKey: PublicKey): Int {// 获取模数并计算其位数
        val modulus = (publicKey as java.security.interfaces.RSAPublicKey).modulus
        return modulus.bitLength() / 8 // 返回位数
    }

    private fun padData(data: String): ByteArray {
        val dataBytes = data.toByteArray(StandardCharsets.UTF_8) // 将字符串转换为字节数组
        val targetLength = 128 // 目标长度
        val paddingLength = targetLength - dataBytes.size // 计算填充长度

        // 创建填充数组
        val prefix = ByteArray(paddingLength)
        Arrays.fill(prefix, 0.toByte()) // 填充零字节

        // 创建新的字节数组并复制数据
        val paddedData = ByteArray(targetLength)
        System.arraycopy(prefix, 0, paddedData, 0, prefix.size) // 复制填充
        System.arraycopy(dataBytes, 0, paddedData, prefix.size, dataBytes.size) // 复制原始数据
        return paddedData
    }

    private fun md5(input: String): String {
        // 创建 MD5 消息摘要实例
        val digest = MessageDigest.getInstance("MD5")
        // 计算输入字符串的哈希值
        val hashBytes = digest.digest(input.toByteArray())
        // 将字节数组转换为十六进制字符串
        return hashBytes.joinToString("") { String.format("%02x", it) }
    }
    
    private fun bytesToHex(bytes: ByteArray): String {
        return bytes.joinToString("") { String.format("%02x", it) }
    }

}
