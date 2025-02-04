import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import { Input, Button, Card, Text } from '@rneui/themed';
import { theme } from '../theme/theme';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const AIScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');

  const handleSend = () => {
    const trimmedText = inputText.trim();
    if (trimmedText) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: trimmedText,
        isUser: true,
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      setTimeout(() => {
        const aiResponse: Message = {
          id: Date.now().toString(),
          text: '我是您的骑行助手，请问有什么可以帮您的？',
          isUser: false,
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={{
      alignSelf: item.isUser ? 'flex-end' : 'flex-start',
      maxWidth: '80%',
      marginVertical: theme.spacing.xs,
    }}>
      <Card containerStyle={{
        backgroundColor: item.isUser ? theme.colors.primary : theme.colors.white,
        borderRadius: 15,
        marginHorizontal: 0,
      }}>
        <Text style={{
          color: item.isUser ? theme.colors.white : theme.colors.text,
        }}>
          {item.text}
        </Text>
      </Card>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
      />
      <View style={{
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        flexDirection: 'row',
      }}>
        <Input
          containerStyle={{ flex: 1 }}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入您的问题..."
          multiline
        />
        <Button
          title="发送"
          onPress={handleSend}
          buttonStyle={{
            backgroundColor: theme.colors.primary,
            borderRadius: 20,
            paddingHorizontal: theme.spacing.lg,
          }}
        />
      </View>
    </View>
  );
};

export default AIScreen; 