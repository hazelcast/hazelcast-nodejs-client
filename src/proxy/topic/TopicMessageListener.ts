export interface TopicMessageListener<E> {
    (item: E): void;
}
