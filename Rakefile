task :default => [ :uninstall, :clean, :build, :install ]

pwd = Dir.pwd

directory "/usr/local/bin"
directory "/tmp"

file "node_modules" do |t|
  sh "npm install"
end

file "nappy" => ["/tmp"] do |t|
  sh "echo '#!/usr/bin/env node
' > ./nappy"
  sh "coffee -c -o /tmp src/nappy.coffee"
  sh "cat /tmp/nappy.js >> ./nappy"
  sh "chmod +x ./nappy"
end

file "/usr/local/bin/nappy" => [ "/usr/local/bin", "nappy" ] do |t|
  Dir.chdir "/usr/local/bin" do |prefix_pwd|
    sh "ln -s #{pwd}/nappy"
  end
end

task :build   => [ "nappy" ]
task :install => [ "/usr/local/bin/nappy" ]
task :clean   => [ :uninstall ] do |t|
  if File.exist? "./nappy" then sh "rm ./nappy" end
end

task :uninstall do |t| if File.symlink? "/usr/local/bin/nappy" then sh "rm /usr/local/bin/nappy" end end

task :clean_modules  do |t| sh "rm -rf ./node_modules" end
task :nuke           => [ :clean_modules, :clean ]
task :rebuild        => [ :nuke, :build ]


