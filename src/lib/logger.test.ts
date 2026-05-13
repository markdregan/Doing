import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger, setLogLevel } from './logger'

beforeEach(() => {
  vi.restoreAllMocks()
  setLogLevel('warn')
})

describe('logger', () => {
  describe('log levels', () => {
    it('suppresses debug and info when level is warn', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      setLogLevel('warn')

      logger.debug('test_op', { key: 'val' })
      logger.info('test_op', { key: 'val' })

      expect(spy).not.toHaveBeenCalled()
    })

    it('allows debug when level is debug', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      setLogLevel('debug')

      logger.debug('test_op', { key: 'val' })

      expect(spy).toHaveBeenCalledTimes(1)
      const args = spy.mock.calls[0]
      expect(args[0]).toContain('[DEBUG]')
      expect(args[0]).toContain('[test_op]')
      expect(args[1]).toEqual({ key: 'val' })
    })

    it('allows info when level is info', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      setLogLevel('info')

      logger.info('test_op', { key: 'val' })

      expect(spy).toHaveBeenCalledTimes(1)
      const args = spy.mock.calls[0]
      expect(args[0]).toContain('[INFO]')
      expect(args[0]).toContain('[test_op]')
    })

    it('always logs errors regardless of level', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      setLogLevel('error')

      logger.error('test_error', new Error('boom'), { taskId: 't1' })

      expect(spy).toHaveBeenCalledTimes(1)
      const args = spy.mock.calls[0]
      expect(args[0]).toContain('[ERROR]')
      expect(args[0]).toContain('[test_error]')
      expect(args[1]).toContain('Error: boom')
    })
  })

  describe('error logging', () => {
    it('formats Error objects with name, message, and stack', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('test error')

      logger.error('op_failed', err, { id: '123' })

      expect(spy).toHaveBeenCalledTimes(1)
      const args = spy.mock.calls[0]
      expect(args[0]).toContain('[ERROR]')
      expect(args[1]).toContain('Error: test error')
      expect(args[2]).toEqual({ id: '123' })
    })

    it('handles non-Error error values', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errObject = { code: 500, message: 'Server error' }

      logger.error('api_error', errObject)

      expect(spy).toHaveBeenCalledTimes(1)
      const args = spy.mock.calls[0]
      expect(args[1]).toContain('500')
    })

    it('accepts error call without metadata', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

      logger.error('simple_error', 'something broke')

      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('child logger', () => {
    it('creates a child logger with merged static metadata', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      setLogLevel('debug')

      const storeLog = logger.child({ module: 'useTaskStore' })
      storeLog.info('task_created', { taskId: 't1' })

      expect(spy).toHaveBeenCalledTimes(1)
      const args = spy.mock.calls[0]
      expect(args[1]).toEqual({ module: 'useTaskStore', taskId: 't1' })
    })

    it('child logger inherits parent level', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      setLogLevel('warn')

      const child = logger.child({ module: 'test' })
      child.debug('test')
      child.info('test')

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('setLogLevel', () => {
    it('changes the log level dynamically', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      setLogLevel('debug')
      logger.debug('test')
      expect(spy).toHaveBeenCalledTimes(1)

      vi.clearAllMocks()
      setLogLevel('warn')
      logger.debug('test')
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('log format', () => {
    it('includes ISO timestamp in the prefix', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      setLogLevel('info')

      logger.info('op')

      const prefix = spy.mock.calls[0][0]
      // Should match: [2024-01-01T00:00:00.000Z] [INFO] [op]
      expect(prefix).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(prefix).toContain('[INFO]')
      expect(prefix).toContain('[op]')
    })
  })
})
