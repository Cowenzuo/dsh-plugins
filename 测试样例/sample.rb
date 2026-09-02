# Ruby 样例
class Sample
  def initialize(value)
    @value = value
  end

  attr_reader :value
end

puts Sample.new(42).value
