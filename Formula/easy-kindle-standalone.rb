# typed: false
# frozen_string_literal: true

class EasyKindleStandalone < Formula
  desc "CLI tool to convert web articles into EPUB and send to Kindle"
  homepage "https://github.com/affanmustafa/easy-kindle"
  version "1.0.0"
  
  url "https://github.com/affanmustafa/easy-kindle/releases/download/v#{version}/easy-kindle"
  sha256 "replace-with-actual-sha256"

  def install
    bin.install "easy-kindle"
    chmod 0755, bin/"easy-kindle"
  end

  test do
    system "#{bin}/easy-kindle", "--help"
  end
end

