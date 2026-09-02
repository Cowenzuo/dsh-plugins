// sample.EXT — C/C++ 样例：类与函数
#pragma once

class Sample {
public:
  explicit Sample(int value) : value_(value) {}
  int get() const { return value_; }

private:
  int value_;
};

template <typename T>
T add(T a, T b) {
  return a + b;
}
