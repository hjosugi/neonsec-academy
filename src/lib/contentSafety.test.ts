import { describe, expect, it } from 'vitest'
import { redactSensitiveText, scanSensitiveText } from './contentSafety'

describe('content safety detectors', () => {
  it('accepts documentation ranges, private ranges, and training domains', () => {
    const text = 'src=203.0.113.7 dst=10.0.0.5 host=api.neoncorp.example mail=ops@neoncorp.example see notes.md password=<redacted>'
    expect(scanSensitiveText(text)).toEqual([])
  })

  it('flags public IPs, real emails, live domains and URLs, credentials, keys, and tokens', () => {
    const text = [
      'target 8.8.8.8',
      'contact admin@realcorp.com',
      'visit shop.realcorp.com',
      'link https://realcorp.com/login',
      'password=hunter2hunter2',
      '-----BEGIN RSA PRIVATE KEY-----',
      'AKIAABCDEFGHIJKLMNOP',
    ].join('\n')
    const kinds = scanSensitiveText(text).map((hit) => hit.kind)
    expect(kinds).toEqual(expect.arrayContaining(['public-ip', 'real-email', 'live-domain', 'live-url', 'credential', 'private-key', 'access-token']))
  })

  it('only checks URL and email hosts in host mode so file names are allowed', () => {
    expect(scanSensitiveText('Reviewed config.yaml and app.py', { domains: 'hosts' })).toEqual([])
    expect(scanSensitiveText('Reviewed config.yaml', { domains: 'strict' }).map((hit) => hit.kind)).toEqual(['live-domain'])
    expect(scanSensitiveText('see https://realcorp.com', { domains: 'hosts' }).map((hit) => hit.kind)).toEqual(['live-url'])
  })

  it('redacts sensitive values but keeps training-safe ones', () => {
    const redacted = redactSensitiveText('8.8.8.8 203.0.113.9 admin@realcorp.com ops@neoncorp.example token=abcdef123456 https://realcorp.com/x')
    expect(redacted).toBe('[ip-removed] 203.0.113.9 [email-removed] ops@neoncorp.example token=[redacted] [link-removed]')
  })
})
