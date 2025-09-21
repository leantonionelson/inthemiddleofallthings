/**
 * Test script to verify the optimized audio playback order
 * This demonstrates the new priority system: pre-generated -> browser TTS -> Gemini TTS (chat only)
 */

import { audioManagerService } from './audioManager';
import { BookChapter } from '../types';

// Test data
const testChapter: BookChapter = {
  id: 'test-chapter',
  title: 'Test Chapter',
  content: 'This is a test chapter to verify the audio optimization system.',
  chapterNumber: 1,
  totalChapters: 1,
  part: 'Test Part'
};

export class AudioOptimizationTest {
  
  /**
   * Test the optimized audio playback for content
   * Should use: pre-generated -> browser TTS (no Gemini TTS)
   */
  static async testContentAudio() {
    console.log('🧪 Testing optimized content audio playback...');
    
    try {
      await audioManagerService.initializeAudio(testChapter, {
        onPlaybackStateChange: (state) => {
          console.log(`📊 Audio state: ${state.audioSource}, loading: ${state.isLoading}`);
          
          if (state.audioSource === 'pre-generated') {
            console.log('✅ SUCCESS: Using pre-generated audio (no API usage)');
          } else if (state.audioSource === 'browser-speech') {
            console.log('✅ SUCCESS: Using browser TTS (no API usage)');
          } else if (state.audioSource === 'gemini-tts') {
            console.log('❌ UNEXPECTED: Using Gemini TTS for content (should not happen)');
          }
        }
      });
    } catch (error) {
      console.error('❌ Content audio test failed:', error);
    }
  }
  
  /**
   * Test the chat audio playback
   * Should use: Gemini TTS (for best quality)
   */
  static async testChatAudio() {
    console.log('🧪 Testing chat audio playback...');
    
    const chatText = "This is a test chat response to verify Gemini TTS is used for chat interactions.";
    
    try {
      await audioManagerService.initializeChatAudio(chatText, {
        onPlaybackStateChange: (state) => {
          console.log(`📊 Chat audio state: ${state.audioSource}, loading: ${state.isLoading}`);
          
          if (state.audioSource === 'gemini-tts') {
            console.log('✅ SUCCESS: Using Gemini TTS for chat (expected API usage)');
          } else if (state.audioSource === 'browser-speech') {
            console.log('⚠️ FALLBACK: Using browser TTS for chat (Gemini TTS unavailable)');
          } else if (state.audioSource === 'pre-generated') {
            console.log('❌ UNEXPECTED: Using pre-generated audio for chat (should not happen)');
          }
        }
      });
    } catch (error) {
      console.error('❌ Chat audio test failed:', error);
    }
  }
  
  /**
   * Run all optimization tests
   */
  static async runAllTests() {
    console.log('🚀 Starting audio optimization tests...\n');
    
    await this.testContentAudio();
    console.log('\n---\n');
    await this.testChatAudio();
    
    console.log('\n🎉 Audio optimization tests completed!');
    console.log('\n📋 Expected Results:');
    console.log('✅ Content audio: pre-generated OR browser TTS (no API usage)');
    console.log('✅ Chat audio: Gemini TTS (API usage expected)');
    console.log('💡 This optimization saves significant API quota for content playback');
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).audioOptimizationTest = AudioOptimizationTest;
}
